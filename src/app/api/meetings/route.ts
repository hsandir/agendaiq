import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from '@/lib/auth/policy';
import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/utils/logger";
import { MeetingWithRelations, MeetingResponse, CreateMeetingRequest } from "@/types/meeting";
import { sanitizeMeetingData } from "@/lib/utils/sanitization";
import { RateLimiters, getClientIdentifier } from "@/lib/utils/rate-limit";
import { memoryCache, cacheKeys, CACHE_DURATIONS } from "@/lib/utils/cache";
import { z } from "zod";
import { isAnyAdmin } from '@/lib/auth/policy';

// Validation schema for creating meetings
const createMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  zoomLink: z.string().url().optional(),
  attendeeIds: z.array(z.number()).optional().default([])
});

// GET /api/meetings - Get meetings based on user role and hierarchy
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.MEETING_CREATE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;
  
  // Add pagination parameters
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const skip = (page - 1) * limit;

  try {
    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const staffRecord = user.staff;
    const hasAdminAccess = isAnyAdmin(user);
    
    // Check cache first
    const cacheKey = cacheKeys.staffMeetings(staffRecord.id, page);
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(cached);
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    let meetingWhereClause;

    if (hasAdminAccess) {
      // Admins can see all meetings in their district
      meetingWhereClause = {
        staff: {
          school_id: staffRecord.school?.id
        }
      };
    } else if (staffRecord.role?.is_leadership) {
      // Leadership roles can see meetings in their school
      meetingWhereClause = {
        OR: [
          { organizer_id: staffRecord.id },
          {
            staff: {
              school_id: staffRecord.school?.id
            }
          },
          {
            meeting_attendee: {
              some: {
                staff_id: staffRecord.id
              }
            }
          }
        ]
      };
    } else {
      // Regular staff can only see their own meetings and meetings they're invited to
      meetingWhereClause = {
        OR: [
          { organizer_id: staffRecord.id },
          {
            meeting_attendee: {
              some: {
                staff_id: staffRecord.id
              }
            }
          }
        ]
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.meeting.count({
      where: meetingWhereClause
    });

    // Fetch meetings with minimal data for list view
    const meetings = await prisma.meeting.findMany({
      where: meetingWhereClause,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        start_time: true,
        end_time: true,
        location: true,
        zoom_join_url: true,
        zoom_link: true,
        status: true,
        organizer_id: true,
        // Only get organizer name for display
        staff: {
          select: {
            users: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        // Only count attendees, don't fetch all data
        _count: {
          select: {
            meeting_attendee: true
          }
        }
      },
      orderBy: {
        start_time: "desc",
      },
    });

    // Format the response with minimal data for performance
    const formattedMeetings = (meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.start_time?.toISOString() ?? new Date().toISOString(),
      endTime: meeting.end_time?.toISOString() ?? new Date().toISOString(),
      zoomLink: meeting.zoom_join_url ?? null,
      status: meeting.status,
      organizerName: meeting.staff.users.name ?? meeting.staff.users.email ?? 'Unknown',
      attendeeCount: meeting._count.meeting_attendee
    })));

    const responseData = { 
      meetings: formattedMeetings,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
    
    // Cache the response
    memoryCache.set(cacheKey, responseData, CACHE_DURATIONS.short);
    
    const response = NextResponse.json(responseData);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return response;
  } catch (error: unknown) {
    await Logger.error("Failed to fetch meetings", { error: String(error), userId: user.id, staffId: (user.staff as Record<string, unknown> | null)?.id }, "meetings");
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

// POST /api/meetings - Create a new meeting
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.MEETING_CREATE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;
  
  // Rate limiting check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = await RateLimiters.meetings.check(request, 10, clientId);
  if (!rateLimitResult.success) {
    await Logger.warn("Meeting creation rate limit exceeded", { userId: user.id }, "meetings");
    return RateLimiters.meetings.createErrorResponse(rateLimitResult);
  }

  try {
    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const staffRecord = user.staff;

    const body = await request.json() as Record<string, unknown>;
    
    // Validate request data
    const validationResult = createMeetingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Sanitize input data
    const sanitizedData = sanitizeMeetingData(validationResult.data);
    const { title, description, startTime, endTime, zoomLink, attendeeIds } = sanitizedData as CreateMeetingRequest;

    // Validate date/time
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date/time format" },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Validate required staff data
    if (!staffRecord.department?.id || !staffRecord.district?.id || !staffRecord.school?.id) {
      return NextResponse.json(
        { error: "Staff member must have complete organizational data" },
        { status: 400 }
      );
    }

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        start_time: start,
        end_time: end,
        zoom_join_url: zoomLink,
        organizer_id: staffRecord.id,
        status: "SCHEDULED",
        department_id: staffRecord.department.id,
        district_id: staffRecord.district.id,
        school_id: staffRecord.school.id,
      },
      include: {
        staff: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: true,
          },
        },
      },
    });

    // Add attendees if provided
    if (attendeeIds && attendeeIds.length > 0) {
      await prisma.meeting_attendee.createMany({
        data: attendeeIds.map((staffId: number) => ({
          meeting_id: meeting.id,
          staff_id: staffId,
          status: "PENDING",
        })),
      });
    }

    // Fetch the complete meeting with attendees
    const completeeMeeting = await prisma.meeting.findUnique({
      where: { id: meeting.id },
      include: {
        staff: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: true,
          },
        },
        meeting_attendee: {
          include: {
            staff: {
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                role: true,
              },
            },
          },
        },
      },
    });
    
    // Clear cache after creating a new meeting
    memoryCache.clear('meetings');

    // Format the response
    const formattedMeeting = {
      id: completeeMeeting!.id,
      title: completeeMeeting!.title,
      description: completeeMeeting!.description,
      startTime: completeeMeeting!.start_time?.toISOString() ?? new Date().toISOString(),
      endTime: completeeMeeting!.end_time?.toISOString() ?? new Date().toISOString(),
      zoomLink: completeeMeeting!.zoom_join_url ?? null,
      status: completeeMeeting!.status,
      organizer: {
        id: completeeMeeting!.staff.id,
        name: completeeMeeting!.staff.users.name,
        email: completeeMeeting!.staff.users.email,
        role: completeeMeeting!.staff.role.key ?? 'UNKNOWN_ROLE',
      },
      attendees: completeeMeeting!.meeting_attendee.map((attendee) => ({
        id: attendee.staff.id,
        name: attendee.staff.users.name,
        email: attendee.staff.users.email,
        role: attendee.staff.role.key ?? 'UNKNOWN_ROLE',
        status: attendee.status ?? 'PENDING',
      })),
    };

    // Audit log the meeting creation
    await prisma.meeting_audit_logs.create({
      data: {
        meeting_id: completeeMeeting!.id,
        user_id: user.id,
        staff_id: Number((user.staff as any)?.id ?? 0),
        action: 'CREATE',
        details: `Created meeting: ${title}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      }
    });
    
    await Logger.info("Meeting created successfully", { meetingId: completeeMeeting!.id, title }, "meetings", { userId: user.id });

    return NextResponse.json({ meeting: formattedMeeting }, { status: 201 });
  } catch (error: unknown) {
    await Logger.error("Failed to create meeting", { error: String(error), userId: user.id, staffId: (user.staff as Record<string, unknown> | null)?.id }, "meetings");
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
} 
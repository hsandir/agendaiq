import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/utils/logger";
import { MeetingWithRelations, MeetingResponse, CreateMeetingRequest } from "@/types/meeting";
import { sanitizeMeetingData } from "@/lib/utils/sanitization";
import { RateLimiters, getClientIdentifier } from "@/lib/utils/rate-limit";
import { z } from "zod";

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
  const authResult = await withAuth(request, { requireStaff: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;

  try {
    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const staffRecord = user.staff;
    const isAdmin = staffRecord.role?.title === 'Administrator';

    let meetingWhereClause;

    if (isAdmin) {
      // Admins can see all meetings in their district
      meetingWhereClause = {
        Staff: {
          school_id: staffRecord.school.id
        }
      };
    } else if (staffRecord.role?.is_leadership) {
      // Leadership roles can see meetings in their school
      meetingWhereClause = {
        OR: [
          { organizer_id: staffRecord.id },
          {
            Staff: {
              school_id: staffRecord.school.id
            }
          },
          {
            MeetingAttendee: {
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
            MeetingAttendee: {
              some: {
                staff_id: staffRecord.id
              }
            }
          }
        ]
      };
    }

    // Fetch meetings based on permission level
    const meetings = await prisma.meeting.findMany({
      where: meetingWhereClause,
      include: {
        Staff: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            Role: true
          },
        },
        MeetingAttendee: {
          include: {
            Staff: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                Role: true
              },
            },
          },
        },
      },
      orderBy: {
        start_time: "desc",
      },
    });

    // Format the response with proper types
    const formattedMeetings: MeetingResponse[] = meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.start_time?.toISOString() || new Date().toISOString(),
      endTime: meeting.end_time?.toISOString() || new Date().toISOString(),
      zoomLink: meeting.zoom_join_url || meeting.zoom_meeting_id ? `/api/meetings/${meeting.id}/zoom` : null,
      status: meeting.status,
      organizer: {
        id: meeting.Staff.id,
        name: meeting.Staff.User.name,
        email: meeting.Staff.User.email,
        role: meeting.Staff.Role.title,
      },
      attendees: meeting.MeetingAttendee.map((attendee) => ({
        id: attendee.Staff.id,
        name: attendee.Staff.User.name,
        email: attendee.Staff.User.email,
        role: attendee.Staff.Role.title,
        status: attendee.status || 'PENDING',
      })),
    }));

    return NextResponse.json({ meetings: formattedMeetings });
  } catch (error) {
    await Logger.error("Failed to fetch meetings", { error: String(error), userId: user.id, staffId: user.staff?.id }, "meetings");
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

// POST /api/meetings - Create a new meeting
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireStaff: true });
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

    const body = await request.json();
    
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
        Staff: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            Role: true,
          },
        },
      },
    });

    // Add attendees if provided
    if (attendeeIds && attendeeIds.length > 0) {
      await prisma.meetingAttendee.createMany({
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
        Staff: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            Role: true,
          },
        },
        MeetingAttendee: {
          include: {
            Staff: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                Role: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedMeeting = {
      id: completeeMeeting!.id,
      title: completeeMeeting!.title,
      description: completeeMeeting!.description,
      startTime: completeeMeeting!.start_time?.toISOString() || new Date().toISOString(),
      endTime: completeeMeeting!.end_time?.toISOString() || new Date().toISOString(),
      zoomLink: completeeMeeting!.zoom_join_url || null,
      status: completeeMeeting!.status,
      organizer: {
        id: completeeMeeting!.Staff.id,
        name: completeeMeeting!.Staff.User.name,
        email: completeeMeeting!.Staff.User.email,
        role: completeeMeeting!.Staff.Role.title,
      },
      attendees: completeeMeeting!.MeetingAttendee.map((attendee) => ({
        id: attendee.Staff.id,
        name: attendee.Staff.User.name,
        email: attendee.Staff.User.email,
        role: attendee.Staff.Role.title,
        status: attendee.status || 'PENDING',
      })),
    };

    return NextResponse.json({ meeting: formattedMeeting }, { status: 201 });
    // Audit log the meeting creation
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: completeeMeeting!.id,
        user_id: user.id,
        staff_id: user.staff?.id,
        action: 'CREATE',
        details: `Created meeting: ${title}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      }
    });
    
    await Logger.info("Meeting created successfully", { meetingId: completeeMeeting!.id, title }, "meetings", { userId: user.id });

    return NextResponse.json({ meeting: formattedMeeting }, { status: 201 });
  } catch (error) {
    await Logger.error("Failed to create meeting", { error: String(error), userId: user.id, staffId: user.staff?.id }, "meetings");
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability, isAnyAdmin } from '@/lib/auth/policy';
import { prisma } from "@/lib/prisma";

// GET /api/meetings/search - Search meetings for continuation feature
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.MEETING_VIEW });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }
    const user = authResult.user!;

    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? '';

    if (query.length < 2) {
      return NextResponse.json({ meetings: [] });
    }

    const staffRecord = user.staff;
    const hasAdminAccess = isAnyAdmin(user);

    // Build search where clause
    let searchWhereClause;

    if (hasAdminAccess) {
      // Admins can search all meetings in their organization
      searchWhereClause = {
        OR: [
          { school_id: staffRecord?.school?.id },
          { district_id: staffRecord?.district?.id }
        ]
      };
    } else {
      // Non-admins can only search meetings they have access to
      const subordinates = await prisma.staff.findMany({
        where: {
          manager_id: staffRecord.id
        },
        select: {
          id: true
        }
      });

      const subordinateIds = (subordinates.map(s => s.id));

      searchWhereClause = {
        OR: [
          // Meetings they organize
          { organizer_id: staffRecord.id },
          // Meetings they're invited to
          {
            meeting_attendee: {
              some: {
                staff_id: staffRecord.id,
              },
            },
          },
          // Meetings organized by their subordinates
          ...(subordinateIds.length > 0 ? [{
            organizer_id: {
              in: subordinateIds
            }
          }] : [])
        ],
      };
    }

    // Add text search conditions
    const textSearchConditions = {
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive' as const
          }
        },
        {
          description: {
            contains: query,
            mode: 'insensitive' as const
          }
        },
        {
          agenda: {
            contains: query,
            mode: 'insensitive' as const
          }
        }
      ]
    };

    // Combine access control and text search
    const finalWhereClause = {
      AND: [
        searchWhereClause,
        textSearchConditions,
        {
          // Only search completed or scheduled meetings (not drafts)
          status: {
            in: ['scheduled', 'completed', 'in_progress']
          }
        }
      ]
    };

    // Search meetings
    const meetings = await prisma.meeting.findMany({
      where: finalWhereClause,
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
            role: {
              select: { key: true }
            }
          },
        },
        department: true,
        meeting_attendee: {
          include: {
            staff: {
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        start_time: "desc",
      },
      take: 10, // Limit to 10 results for performance
    });

    // Transform meetings for frontend
    const transformedMeetings = (meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      start_time: meeting.start_time?.toISOString(),
      end_time: meeting.end_time?.toISOString(),
      status: meeting.status,
      meeting_type: meeting.meeting_type,
      organizer: {
        id: meeting.staff.users.id,
        name: meeting.staff.users.name,
        email: meeting.staff.users.email,
        roleKey: meeting.staff.role?.key ?? null
      },
      department: meeting.department?.name,
      attendee_count: meeting.meeting_attendee.length,
      attendees: meeting.meeting_attendee.slice(0, 3).map(attendee => ({
        name: attendee.staff.users.name,
      })),
    })));

    return NextResponse.json({ 
      meetings: transformedMeetings,
      total: transformedMeetings.length,
      query: query
    });

  } catch (error: unknown) {
    console.error("Error searching meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from "@/lib/auth/api-auth";
import { AuthenticatedUser } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { isAnyAdmin } from '@/lib/auth/policy';

// GET /api/meetings/search - Search meetings for continuation feature
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: _AuthenticatedUser) => {
  try {
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
          { school_id: parseInt(staffRecord)?.school?.id },
          { district_id: parseInt(staffRecord)?.district?.id }
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
            MeetingAttendee: {
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
        Department: true,
        MeetingAttendee: {
          include: {
            Staff: {
              include: {
                User: {
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
        id: meeting.Staff.User.id,
        name: meeting.Staff.User.name,
        email: meeting.Staff.User.email,
        role: meeting.Staff.Role?.title
      },
      department: meeting.Department?.name,
      attendee_count: meeting.MeetingAttendee.length,
      attendees: meeting.MeetingAttendee.slice(0, 3).map(attendee => ({
        name: attendee.Staff.User.name,
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
}); 
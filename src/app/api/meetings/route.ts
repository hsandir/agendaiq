import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

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

    // Format the response
    const formattedMeetings = meetings.map((meeting: any) => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.start_time.toISOString(),
      endTime: meeting.end_time.toISOString(),
      zoomLink: meeting.zoom_link,
      status: meeting.status,
      organizer: {
        id: meeting.Staff.id,
        name: meeting.Staff.User.name,
        email: meeting.Staff.User.email,
        role: meeting.Staff.Role.title,
      },
      attendees: meeting.MeetingAttendee.map((attendee: any) => ({
        id: attendee.Staff.id,
        name: attendee.Staff.User.name,
        email: attendee.Staff.User.email,
        role: attendee.Staff.Role.title,
        status: attendee.status,
      })),
    }));

    return NextResponse.json({ meetings: formattedMeetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/meetings - Create a new meeting
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      description,
      startTime,
      endTime,
      zoomLink,
      attendeeIds = [],
    } = body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      );
    }

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
        // TODO: Add zoom_link field to Meeting model in schema
        // zoom_link: zoomLink,
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
    if (attendeeIds.length > 0) {
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
      zoomLink: (completeeMeeting as any).zoom_link || null,
      status: completeeMeeting!.status,
      organizer: {
        id: completeeMeeting!.Staff.id,
        name: completeeMeeting!.Staff.User.name,
        email: completeeMeeting!.Staff.User.email,
        role: completeeMeeting!.Staff.Role.title,
      },
      attendees: completeeMeeting!.MeetingAttendee.map((attendee: any) => ({
        id: attendee.Staff.id,
        name: attendee.Staff.User.name,
        email: attendee.Staff.User.email,
        role: attendee.Staff.Role.title,
        status: attendee.status,
      })),
    };

    return NextResponse.json({ meeting: formattedMeeting }, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 
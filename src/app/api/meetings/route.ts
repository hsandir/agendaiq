import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from "@/lib/auth/api-auth";
import { AuthenticatedUser } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";

// GET /api/meetings - Get meetings based on user role and hierarchy
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const staffRecord = user.staff;
    const isAdmin = staffRecord.role.title === 'Administrator';

    let meetingWhereClause;

    if (isAdmin) {
      // Admins can see all meetings in their organization
      meetingWhereClause = {
        OR: [
          { school_id: staffRecord.school.id },
          { district_id: staffRecord.district.id }
        ]
      };
    } else {
      // Non-admins can see:
      // 1. Meetings they organize
      // 2. Meetings they're invited to
      // 3. Meetings organized by people who report to them (subordinates)
      
      // First, find all staff who report to this user (subordinates)
      const subordinates = await prisma.staff.findMany({
        where: {
          manager_id: staffRecord.id
        },
        select: {
          id: true
        }
      });

      const subordinateIds = subordinates.map(s => s.id);

      meetingWhereClause = {
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
        Department: true
      },
      orderBy: {
        start_time: "asc",
      },
    });

    // Transform meetings for frontend
    const transformedMeetings = meetings.map(meeting => ({
      id: meeting.id.toString(),
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.start_time?.toISOString() || '',
      endTime: meeting.end_time?.toISOString() || '',
      zoomLink: meeting.zoom_join_url,
      status: meeting.status || 'scheduled',
      organizer: {
        id: meeting.Staff.User.id,
        name: meeting.Staff.User.name,
        email: meeting.Staff.User.email,
        role: meeting.Staff.Role?.title
      },
      attendees: meeting.MeetingAttendee.map(attendee => ({
        id: attendee.id,
        status: attendee.status || 'pending',
        user: {
          ...attendee.Staff.User,
          role: attendee.Staff.Role?.title
        }
      })),
      department: meeting.Department?.name,
      isOrganizer: meeting.organizer_id === staffRecord.id,
      canEdit: isAdmin || meeting.organizer_id === staffRecord.id,
    }));

    return NextResponse.json({ 
      meetings: transformedMeetings,
      total: transformedMeetings.length,
      userRole: staffRecord.role.title,
      isAdmin
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

// POST /api/meetings - Create a new meeting
export const POST = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {
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

    // Validate time order
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        start_time: start,
        end_time: end,
        zoom_join_url: zoomLink,
        organizer_id: staffRecord.id,
        department_id: staffRecord.department.id,
        school_id: staffRecord.school.id,
        district_id: staffRecord.district.id,
        MeetingAttendee: {
          create: attendeeIds.map((staffId: string) => ({
            staff_id: parseInt(staffId),
            status: "pending",
          })),
        },
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
              },
            },
          },
        },
      },
    });

    // Create audit log entry for meeting creation
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: meeting.id,
        user_id: user.id,
        action: "created",
        details: {
          title: meeting.title,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          attendee_count: attendeeIds.length
        }
      }
    });

    // Transform meeting for response
    const transformedMeeting = {
      id: meeting.id.toString(),
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.start_time?.toISOString() || '',
      endTime: meeting.end_time?.toISOString() || '',
      zoomLink: meeting.zoom_join_url,
      status: meeting.status || 'scheduled',
      organizer: {
        id: meeting.Staff.User.id,
        name: meeting.Staff.User.name,
        email: meeting.Staff.User.email,
      },
      attendees: meeting.MeetingAttendee.map(attendee => ({
        id: attendee.id,
        status: attendee.status || 'pending',
        user: attendee.Staff.User,
      })),
      isOrganizer: true,
    };

    return NextResponse.json({
      meeting: transformedMeeting,
      message: "Meeting created successfully",
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

// PUT /api/meetings - Update an existing meeting
export const PUT = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const staffRecord = user.staff;
    const isAdmin = staffRecord.role.title === 'Administrator';

    const body = await request.json();
    const {
      id,
      title,
      description,
      startTime,
      endTime,
      zoomLink,
      attendeeIds = [],
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 });
    }

    const meetingId = parseInt(id);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    // Check if meeting exists and user has permission to edit
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        MeetingAttendee: true
      }
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (!isAdmin && existingMeeting.organizer_id !== staffRecord.id) {
      return NextResponse.json({ error: "Not authorized to edit this meeting" }, { status: 403 });
    }

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Validate time order
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Store old values for audit log
    const oldValues = {
      title: existingMeeting.title,
      description: existingMeeting.description,
      start_time: existingMeeting.start_time,
      end_time: existingMeeting.end_time,
      attendee_count: existingMeeting.MeetingAttendee.length
    };

    // Update meeting
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title,
        description,
        start_time: start,
        end_time: end,
        zoom_join_url: zoomLink,
        MeetingAttendee: {
          deleteMany: {},
          create: attendeeIds.map((staffId: string) => ({
            staff_id: parseInt(staffId),
            status: "pending",
          })),
        },
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
              },
            },
          },
        },
      },
    });

    // Create audit log entry for meeting update
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: meeting.id,
        user_id: user.id,
        action: "updated",
        details: {
          old_values: oldValues,
          new_values: {
            title: meeting.title,
            description: meeting.description,
            start_time: meeting.start_time,
            end_time: meeting.end_time,
            attendee_count: attendeeIds.length
          }
        }
      }
    });

    // Transform meeting for response
    const transformedMeeting = {
      id: meeting.id.toString(),
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.start_time?.toISOString() || '',
      endTime: meeting.end_time?.toISOString() || '',
      zoomLink: meeting.zoom_join_url,
      status: meeting.status || 'scheduled',
      organizer: {
        id: meeting.Staff.User.id,
        name: meeting.Staff.User.name,
        email: meeting.Staff.User.email,
      },
      attendees: meeting.MeetingAttendee.map(attendee => ({
        id: attendee.id,
        status: attendee.status || 'pending',
        user: attendee.Staff.User,
      })),
      isOrganizer: meeting.organizer_id === staffRecord.id,
    };

    return NextResponse.json({
      meeting: transformedMeeting,
      message: "Meeting updated successfully",
    });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}); 
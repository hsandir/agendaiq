import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/meetings/[id] - Get meeting details
export async function GET(request: NextRequest, props: Props) {
  const params = await props.params;
  
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    const meetingId = parseInt(params.id);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        Department: true,
        District: true,
        School: true,
        Staff: {
          include: {
            User: true,
            Role: true
          }
        },
        MeetingAttendee: {
          include: {
            Staff: {
              include: {
                User: true,
                Role: true,
                Department: true
              }
            }
          }
        },
        MeetingNote: {
          include: {
            Staff: {
              include: {
                User: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        MeetingAgendaItems: {
          include: {
            ResponsibleStaff: {
              include: {
                User: true
              }
            },
            Comments: {
              include: {
                Staff: {
                  include: {
                    User: true
                  }
                }
              }
            },
            ActionItems: {
              include: {
                AssignedTo: {
                  include: {
                    User: true
                  }
                }
              }
            }
          },
          orderBy: {
            order_index: 'asc'
          }
        },
        MeetingActionItems: {
          include: {
            AssignedTo: {
              include: {
                User: true,
                Role: true
              }
            }
          }
        },
        ParentMeeting: true,
        ContinuationMeetings: {
          orderBy: {
            start_time: 'desc'
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Check if user is authorized to view this meeting
    const isAdmin = user.staff?.role.title === 'Administrator';
    const isOrganizer = meeting.organizer_id === user.staff?.id;
    const isAttendee = meeting.MeetingAttendee.some(ma => ma.staff_id === user.staff?.id);
    const isSameDepartment = meeting.department_id === user.staff?.department.id;

    if (!isAdmin && !isOrganizer && !isAttendee && !isSameDepartment) {
      return NextResponse.json({ error: "Not authorized to view this meeting" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await requireAuth(AuthPresets.requireStaff);
    
    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const { id } = await params;
    const meetingId = parseInt(id);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    const body = await request.json();
    const { agenda, notes, status } = body;

    // Check permissions
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { MeetingAttendee: true }
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const isAdmin = user.staff.role.title === 'Administrator';
    const isOrganizer = existingMeeting.organizer_id === user.staff.id;

    if (!isAdmin && !isOrganizer) {
      return NextResponse.json({ error: "Not authorized to edit this meeting" }, { status: 403 });
    }

    // Store old values for audit log
    const oldValues = {
      title: existingMeeting.title,
      description: existingMeeting.description,
      start_time: existingMeeting.start_time,
      end_time: existingMeeting.end_time,
      agenda: existingMeeting.agenda,
      notes: existingMeeting.notes,
      status: existingMeeting.status,
      attendee_count: existingMeeting.MeetingAttendee.length
    };

    // Prepare update data
    const updateData: any = {};
    
    if (agenda !== undefined) updateData.agenda = agenda;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    // Update meeting
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: updateData,
    });

    // TODO: Add meetingAuditLog model to schema
    // Create audit log entry for meeting update
    // await prisma.meetingAuditLog.create({
    //   data: {
    //     meeting_id: updatedMeeting.id,
    //     user_id: user.id,
    //     action: status === 'scheduled' ? "completed_step_2" : "updated",
    //     details: {
    //       old_values: oldValues,
    //       new_values: {
    //         title: updatedMeeting.title,
    //         description: updatedMeeting.description,
    //         start_time: updatedMeeting.start_time,
    //         end_time: updatedMeeting.end_time,
    //         agenda: updatedMeeting.agenda,
    //         notes: updatedMeeting.notes,
    //         status: updatedMeeting.status,
    //         attendee_count: oldValues.attendee_count
    //       }
    //     }
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      meeting: updatedMeeting 
    });

  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" }, 
      { status: 500 }
    );
  }
} 
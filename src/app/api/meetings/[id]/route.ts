import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from '@/lib/auth/policy';
import { Logger } from "@/lib/utils/logger";
import { MeetingUpdateData } from "@/types/meeting";
import { sanitizeMeetingData } from "@/lib/utils/sanitization";
import { isAnyAdmin } from '@/lib/auth/policy';
import { z } from "zod";

// Validation schema for updating meetings
const updateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  agenda: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  zoomLink: z.string().url().optional()
});

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
    const hasAdminAccess = isAnyAdmin(user);
    const isOrganizer = meeting.organizer_id === user.staff?.id;
    const isAttendee = meeting.MeetingAttendee.some(ma => ma.staff_id === user.staff?.id);
    const isSameDepartment = meeting.department_id === user.staff?.department?.id;

    if (!hasAdminAccess && !isOrganizer && !isAttendee && !isSameDepartment) {
      return NextResponse.json({ error: "Not authorized to view this meeting" }, { status: 403 });
    }

    // Audit log the view
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: meetingId,
        user_id: user.id,
        staff_id: user.staff?.id,
        action: 'VIEW',
        details: 'Viewed meeting details',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      }
    }).catch(() => {}); // Don't fail if audit log fails
    
    return NextResponse.json({
      success: true,
      meeting
    });
  } catch (error) {
    await Logger.error("Failed to fetch meeting", { error: String(error) }, "meetings");
    return NextResponse.json(
      { error: "Failed to fetch meeting details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: Props
) {
  try {
    const params = await props.params;
    
    // Use consistent auth pattern
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.MEETING_CREATE });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;
    
    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const { id } = params;
    const meetingId = parseInt(id);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate request data
    const validationResult = updateMeetingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Sanitize input data
    const sanitizedData = sanitizeMeetingData(validationResult.data);

    // Check permissions
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { MeetingAttendee: true }
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const hasAdminAccess = isAnyAdmin(user);
    const isOrganizer = existingMeeting.organizer_id === user.staff?.id;

    if (!hasAdminAccess && !isOrganizer) {
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

    // Prepare update data with proper types
    const updateData: MeetingUpdateData = {};
    
    if (sanitizedData.title !== undefined) updateData.title = sanitizedData.title;
    if (sanitizedData.description !== undefined) updateData.description = sanitizedData.description;
    if (sanitizedData.agenda !== undefined) updateData.agenda = sanitizedData.agenda;
    if (sanitizedData.notes !== undefined) updateData.notes = sanitizedData.notes;
    if (sanitizedData.status !== undefined) updateData.status = sanitizedData.status;
    if (sanitizedData.startTime !== undefined) updateData.start_time = new Date(sanitizedData.startTime);
    if (sanitizedData.endTime !== undefined) updateData.end_time = new Date(sanitizedData.endTime);
    if (sanitizedData.zoomLink !== undefined) updateData.zoom_join_url = sanitizedData.zoomLink;

    // Update meeting
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: updateData,
    });

    // Create audit log entry for meeting update
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: updatedMeeting.id,
        user_id: user.id,
        staff_id: user.staff?.id,
        action: 'UPDATE',
        details: `Updated meeting: ${updatedMeeting.title}`,
        changes: {
          old_values: oldValues,
          new_values: {
            title: updatedMeeting.title,
            description: updatedMeeting.description,
            start_time: updatedMeeting.start_time,
            end_time: updatedMeeting.end_time,
            agenda: updatedMeeting.agenda,
            notes: updatedMeeting.notes,
            status: updatedMeeting.status,
            attendee_count: oldValues.attendee_count
          }
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({ 
      success: true, 
      meeting: updatedMeeting 
    });

  } catch (error) {
    await Logger.error("Failed to update meeting", { error: String(error) }, "meetings");
    return NextResponse.json(
      { error: "Failed to update meeting" }, 
      { status: 500 }
    );
  }
} 
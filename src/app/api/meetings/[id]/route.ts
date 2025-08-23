import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from '@/lib/auth/policy';
import { Logger } from "@/lib/utils/logger";
import { MeetingUpdateData } from "@/types/meeting";
import { sanitizeMeetingData } from "@/lib/utils/sanitization";
import { isAnyAdmin } from '@/lib/auth/policy';
import { z } from "zod";

// Validation schema for agenda items
const agendaItemSchema = z.object({
  id: z.union([z.number(), z.undefined()]),
  topic: z.string().min(1),
  description: z.string().optional(),
  purpose: z.string().optional(),
  priority: z.string().optional(),
  duration_minutes: z.number().optional(),
  responsible_staff_id: z.number().nullable().optional(),
  status: z.string().optional(),
  order_index: z.number()
});

// Validation schema for updating meetings
const updateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  start_time: z.string().optional(), // Accept ISO string
  end_time: z.string().optional(),   // Accept ISO string
  meeting_type: z.string().optional(),
  location: z.string().optional(),
  zoom_meeting_id: z.string().optional(),
  zoom_link: z.string().optional(),
  calendar_integration: z.string().nullable().optional(),
  agenda: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  attendeeIds: z.array(z.string().transform(id => parseInt(id, 10))).optional(),
  agendaItems: z.array(agendaItemSchema).optional()
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
        department: true,
        district: true,
        school: true,
        staff: {
          include: {
            users: true,
            role: true
          }
        },
        meeting_attendee: {
          include: {
            staff: {
              include: {
                users: true,
                role: true,
                department: true
              }
            }
          }
        },
        meeting_notes: {
          include: {
            staff: {
              include: {
                users: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        meeting_agenda_items: {
          include: {
            responsible_staff: {
              include: {
                users: true
              }
            },
            comments: {
              include: {
                staff: {
                  include: {
                    users: true
                  }
                }
              }
            },
            action_items: {
              include: {
                assigned_to: {
                  include: {
                    users: true
                  }
                }
              }
            }
          },
          orderBy: {
            order_index: 'asc'
          }
        },
        meeting_action_items: {
          include: {
            assigned_to: {
              include: {
                users: true,
                role: true
              }
            }
          }
        },
        parent_meeting: true,
        continuation_meetings: {
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
    const isAttendee = meeting.meeting_attendee.some(ma => ma.staff_id === user.staff?.id);
    const isSameDepartment = meeting.department_id === user.staff?.department?.id;

    if (!hasAdminAccess && !isOrganizer && !isAttendee && !isSameDepartment) {
      return NextResponse.json({ error: "Not authorized to view this meeting" }, { status: 403 });
    }

    // Audit log the view
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: meetingId,
        user_id: parseInt(user.id),
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
  } catch (error: unknown) {
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
      include: { meeting_attendee: true }
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
      attendee_count: existingMeeting.meeting_attendee.length
    };

    // Prepare update data with proper types
    const updateData: Record<string, unknown> = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.meeting_type !== undefined) updateData.meeting_type = body.meeting_type;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.zoom_meeting_id !== undefined) updateData.zoom_meeting_id = body.zoom_meeting_id;
    if (body.zoom_link !== undefined) updateData.zoom_link = body.zoom_link;
    if (body.calendar_integration !== undefined) updateData.calendar_integration = body.calendar_integration;
    if (body.agenda !== undefined) updateData.agenda = body.agenda;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.start_time !== undefined) updateData.start_time = new Date(body.start_time);
    if (body.end_time !== undefined) updateData.end_time = new Date(body.end_time);

    // Update meeting
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: updateData,
    });

    // Update attendees if provided
    if (body.attendeeIds && Array.isArray(body.attendeeIds)) {
      // Remove existing attendees
      await prisma.meetingAttendee.deleteMany({
        where: { meeting_id: meetingId }
      });

      // Add new attendees
      if (body.attendeeIds.length > 0) {
        await prisma.meetingAttendee.createMany({
          data: body.attendeeIds.map((staffId: string) => ({
            meeting_id: meetingId,
            staff_id: parseInt(staffId),
            status: 'pending'
          }))
        });
      }
    }

    // Create audit log entry for meeting update
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: updatedMeeting.id,
        user_id: parseInt(user.id),
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

  } catch (error: unknown) {
    await Logger.error("Failed to update meeting", { error: String(error) }, "meetings");
    return NextResponse.json(
      { error: "Failed to update meeting" }, 
      { status: 500 }
    );
  }
} 
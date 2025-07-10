import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const user = await requireAuth(AuthPresets.requireStaff);
    
    if (!user.staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    const meetingId = parseInt(params.id);
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

    // Create audit log entry for meeting update
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: updatedMeeting.id,
        user_id: user.id,
        action: status === 'scheduled' ? "completed_step_2" : "updated",
        details: {
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
        }
      }
    });

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
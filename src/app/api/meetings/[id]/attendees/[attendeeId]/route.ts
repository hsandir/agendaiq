import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { isAnyAdmin } from '@/lib/auth/policy';

interface RouteContext {
  params: Promise<{ id: string; attendeeId: string }>;
}

// DELETE /api/meetings/[id]/attendees/[attendeeId] - Remove attendee from meeting
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    try {
      const resolvedParams = await context.params;
      const meetingId = parseInt(resolvedParams.id);
      const attendeeStaffId = parseInt(resolvedParams.attendeeId);

      if (isNaN(meetingId) || isNaN(attendeeStaffId)) {
        return NextResponse.json(
          { error: 'Invalid meeting ID or attendee ID' },
          { status: 400 }
        );
      }

      // Check if meeting exists and user has permission to modify
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId }
      });

      if (!meeting) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        );
      }

      // Check permissions - Zero Degradation Protocol
      const hasAdminAccess = isAnyAdmin(user);
      const isOrganizer = meeting.organizer_id === user.staff?.id;

      if (!hasAdminAccess && !isOrganizer) {
        return NextResponse.json(
          { error: 'Only meeting organizers or admins can remove attendees' },
          { status: 403 }
        );
      }

      // Find and remove attendee
      const attendee = await prisma.meeting_attendee.findFirst({
        where: {
          meeting_id: meetingId,
          staff_id: attendeeStaffId
        }
      });

      if (!attendee) {
        return NextResponse.json(
          { error: 'Attendee not found in this meeting' },
          { status: 404 }
        );
      }

      // Remove attendee - Zero Degradation Protocol (preserve data integrity)
      await prisma.meeting_attendee.delete({
        where: {
          id: attendee.id
        }
      });

      return NextResponse.json({ 
        message: 'Attendee removed successfully' 
      });

    } catch (error) {
      console.error('Error removing meeting attendee:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

// PATCH /api/meetings/[id]/attendees/[attendeeId]/status - Update attendee status
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    try {
      const resolvedParams = await context.params;
      const meetingId = parseInt(resolvedParams.id);
      const attendeeStaffId = parseInt(resolvedParams.attendeeId);

      if (isNaN(meetingId) || isNaN(attendeeStaffId)) {
        return NextResponse.json(
          { error: 'Invalid meeting ID or attendee ID' },
          { status: 400 }
        );
      }

      const body = await request.json() as { status?: unknown };
      const { status } = body;

      if (!status || typeof status !== 'string' || !['pending', 'accepted', 'declined'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: pending, accepted, or declined' },
          { status: 400 }
        );
      }

      // Check if meeting exists
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId }
      });

      if (!meeting) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        );
      }

      // Find attendee
      const attendee = await prisma.meeting_attendee.findFirst({
        where: {
          meeting_id: meetingId,
          staff_id: attendeeStaffId
        }
      });

      if (!attendee) {
        return NextResponse.json(
          { error: 'Attendee not found in this meeting' },
          { status: 404 }
        );
      }

      // Check permissions - Zero Degradation Protocol
      const hasAdminAccess = isAnyAdmin(user);
      const isOrganizer = meeting.organizer_id === user.staff?.id;
      const isSelfUpdate = attendeeStaffId === user.staff?.id;

      if (!hasAdminAccess && !isOrganizer && !isSelfUpdate) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Update attendee status - Zero Degradation Protocol (preserve data integrity)
      const updatedAttendee = await prisma.meeting_attendee.update({
        where: { id: attendee.id },
        data: { 
          status: (status as string).toUpperCase()
        },
        include: {
          staff: {
            include: {
              users: true,
              role: true,
              department: true
            }
          }
        }
      });

      // Return transformed attendee data
      const transformedAttendee = {
        id: updatedAttendee.staff.id.toString(),
        name: updatedAttendee.staff.users.name ?? updatedAttendee.staff.users.email ?? '',
        email: updatedAttendee.staff.users.email || '',
        status: (updatedAttendee.status ?? 'pending').toLowerCase(),
        role: updatedAttendee.staff.role.key,
        department: updatedAttendee.staff.department.name,
        staffId: updatedAttendee.staff_id
      };

      return NextResponse.json({ 
        message: 'Attendee status updated successfully',
        attendee: transformedAttendee
      });

    } catch (error) {
      console.error('Error updating attendee status:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
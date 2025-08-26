import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { isAnyAdmin } from '@/lib/auth/policy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/meetings/[id]/attendees - Get meeting attendees
export async function GET(
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

      if (isNaN(meetingId)) {
        return NextResponse.json(
          { error: 'Invalid meeting ID' },
          { status: 400 }
        );
      }

      // Check if meeting exists and user has access
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
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
          }
        }
      });

      if (!meeting) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        );
      }

      // Check permissions - Zero Degradation Protocol (preserve existing access control)
      const hasAdminAccess = isAnyAdmin(user);
      const isOrganizer = meeting.organizer_id === user.staff?.id;
      const isAttendee = meeting.meeting_attendee.some(
        attendee => attendee.staff_id === user.staff?.id
      );

      if (!hasAdminAccess && !isOrganizer && !isAttendee) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Transform attendees data
      const attendees = meeting.meeting_attendee.map(attendee => ({
        id: attendee.staff.id.toString(),
        name: attendee.staff.users.name ?? attendee.staff.users.email ?? '',
        email: attendee.staff.users.email || '',
        status: attendee.status,
        role: attendee.staff.role.title,
        department: attendee.staff.department.name,
        staffId: attendee.staff_id
      }));

      return NextResponse.json({ attendees });

    } catch (error) {
      console.error('Error fetching meeting attendees:', error);
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

// POST /api/meetings/[id]/attendees - Add attendee to meeting
export async function POST(
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

      if (isNaN(meetingId)) {
        return NextResponse.json(
          { error: 'Invalid meeting ID' },
          { status: 400 }
        );
      }

      const body = await request.json() as { staffId?: unknown };
      const { staffId } = body;

      if (!staffId || typeof staffId !== 'number' && typeof staffId !== 'string' || isNaN(parseInt(String(staffId)))) {
        return NextResponse.json(
          { error: 'Invalid staff ID' },
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
      const userStaffId = user.staff?.id;
      const isOrganizer = meeting.organizer_id === userStaffId;

      // Debug logging for permission issues
      console.log('Attendee addition permission check:', {
        hasAdminAccess,
        userStaffId,
        organizerId: meeting.organizer_id,
        isOrganizer,
        meetingId
      });

      if (!hasAdminAccess && !isOrganizer) {
        return NextResponse.json(
          { error: 'Only meeting organizers or admins can add attendees' },
          { status: 403 }
        );
      }

      // Check if staff exists
      const staff = await prisma.staff.findUnique({
        where: { id: parseInt(String(staffId)) },
        include: {
          users: true,
          role: true,
          department: true
        }
      });

      if (!staff) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      // Check if already an attendee
      const existingAttendee = await prisma.meeting_attendee.findFirst({
        where: {
          meeting_id: meetingId,
          staff_id: parseInt(String(staffId))
        }
      });

      if (existingAttendee) {
        return NextResponse.json(
          { error: 'Staff member is already an attendee' },
          { status: 409 }
        );
      }

      // Add attendee - Zero Degradation Protocol (preserve data integrity)
      const attendee = await prisma.meeting_attendee.create({
        data: {
          meeting_id: meetingId,
          staff_id: parseInt(String(staffId)),
          status: 'PENDING'
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
        id: attendee.staff.id.toString(),
        name: attendee.staff.users.name ?? attendee.staff.users.email ?? '',
        email: attendee.staff.users.email || '',
        status: (attendee.status ?? 'pending').toLowerCase(),
        role: attendee.staff.role.title,
        department: attendee.staff.department.name,
        staffId: attendee.staff_id
      };

      return NextResponse.json({ 
        message: 'Attendee added successfully',
        attendee: transformedAttendee
      });

    } catch (error) {
      console.error('Error adding meeting attendee:', error);
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
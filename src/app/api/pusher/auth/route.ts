import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    // Get the request body
    const body = await request.json();
    const socketId = body.socket_id;
    const channel = body.channel_name;

    if (!socketId || !channel) {
      return NextResponse.json(
        { error: 'Socket ID and channel name are required' },
        { status: 400 }
      );
    }

    // Extract meeting ID from channel name
    const meetingIdMatch = channel.match(/meeting-(\d+)$/);
    if (!meetingIdMatch) {
      return NextResponse.json(
        { error: 'Invalid channel name' },
        { status: 400 }
      );
    }

    const meetingId = parseInt(meetingIdMatch[1]);

    // Check if user has access to this meeting
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        MeetingAttendee: {
          where: { staff_id: user.staff?.id || -1 }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized
    const isOrganizer = meeting.organizer_id === user.staff?.id;
    const isAttendee = meeting.MeetingAttendee.length > 0;
    const isAdmin = user.staff?.role?.title === 'Administrator';

    if (!isOrganizer && !isAttendee && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized access to this meeting' },
        { status: 403 }
      );
    }

    // Generate auth response
    let authResponse;
    
    if (channel.startsWith('presence-')) {
      // For presence channels, include user data
      const presenceData = {
        user_id: user.id.toString(),
        user_info: {
          name: user.name,
          email: user.email,
          staff_id: user.staff?.id,
          role: user.staff?.role?.title,
        }
      };
      authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
    } else {
      // For private channels
      authResponse = pusherServer.authorizeChannel(socketId, channel);
    }

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
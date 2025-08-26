import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { pusherServer, CHANNELS } from '@/lib/pusher';
import { isAnyAdmin } from '@/lib/auth/policy';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const params = await props.params;
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const comments = await prisma.agenda_item_comments.findMany({
      where: { agenda_item_id: itemId },
      include: {
        staff: {
          include: {
            users: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: comments
    });

  } catch (error: unknown) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const params = await props.params;
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    const meetingId = parseInt(params.id);
    const itemId = parseInt(params.itemId);

    if (isNaN(meetingId) || isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid meeting or item ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json() as Record<string, unknown>;
    const validationResult = createCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if user has access to this meeting
    const agendaItem = await prisma.meeting_agenda_items.findUnique({
      where: { id: itemId },
      include: {
        meeting: {
          include: {
            meeting_attendee: {
              where: { staff_id: user.staff?.id ?? -1 }
            }
          }
        }
      }
    });

    if (!agendaItem || agendaItem.meeting_id !== meetingId) {
      return NextResponse.json(
        { error: 'Agenda item not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isOrganizer = agendaItem.meeting.organizer_id === user.staff?.id;
    const isAttendee = agendaItem.meeting.meeting_attendee.length > 0;
    const hasAdminAccess = isAnyAdmin(user);

    if (!isOrganizer && !isAttendee && !hasAdminAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions to comment on this agenda item' },
        { status: 403 }
      );
    }

    // Create the comment
    const comment = await prisma.agenda_item_comments.create({
      data: {
        comment: validationResult.data.content,
        agenda_item_id: itemId,
        staff_id: user.staff?.id ?? 0
      },
      include: {
        staff: {
          include: {
            users: true
          }
        }
      }
    });

    // Trigger Pusher event for real-time update
    await pusherServer.trigger(
      CHANNELS.meeting(meetingId),
      'comment-added',
      {
        itemId,
        comment,
        addedBy: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        timestamp: new Date().toISOString()
      }
    );

    return NextResponse.json({
      success: true,
      data: comment
    });

  } catch (error: unknown) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
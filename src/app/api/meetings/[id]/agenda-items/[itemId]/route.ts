import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher';
import { isAnyAdmin } from '@/lib/auth/policy';
import { z } from 'zod';

const updateSchema = z.object({
  topic: z.string().optional(),
  problem_statement: z.string().nullable().optional(),
  proposed_solution: z.string().nullable().optional(),
  decisions_actions: z.string().nullable().optional(),
  status: z.enum(['Pending', 'Ongoing', 'Resolved', 'Assigned_to_local', 'Deferred']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  responsible_staff_id: z.number().nullable().optional(),
});

export async function PATCH(
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

    const meetingId = params.id;
    const itemId = parseInt(params.itemId);

    if (isNaN(meetingId) || isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid meeting or item ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if agenda item exists and user has permission
    const agendaItem = await prisma.meetingAgendaItem.findUnique({
      where: { id: itemId },
      include: {
        Meeting: {
          include: {
            MeetingAttendee: {
              where: { staff_id: user.staff?.id || -1 }
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
    const isOrganizer = agendaItem.Meeting.organizer_id === user.staff?.id;
    const hasAdminAccess = isAnyAdmin(user);
    const isResponsible = agendaItem.responsible_staff_id === user.staff?.id;

    if (!isOrganizer && !hasAdminAccess && !isResponsible) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this agenda item' },
        { status: 403 }
      );
    }

    // Update the agenda item
    const updatedItem = await prisma.meetingAgendaItem.update({
      where: { id: itemId },
      data: validationResult.data,
      include: {
        ResponsibleStaff: {
          include: {
            User: true
          }
        },
        Comments: true,
        ActionItems: true
      }
    });

    // Trigger Pusher event for real-time update
    await pusherServer.trigger(
      CHANNELS.meeting(meetingId),
      EVENTS.AGENDA_ITEM_UPDATED,
      {
        itemId,
        updates: validationResult.data,
        updatedBy: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        timestamp: new Date().toISOString()
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedItem
    });

  } catch (error: unknown) {
    console.error('Error updating agenda item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const params = await props.params;
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.MEETING_CREATE });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    const meetingId = params.id;
    const itemId = parseInt(params.itemId);

    if (isNaN(meetingId) || isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid meeting or item ID' },
        { status: 400 }
      );
    }

    // Delete the agenda item
    await prisma.meetingAgendaItem.delete({
      where: { id: itemId }
    });

    // Trigger Pusher event
    await pusherServer.trigger(
      CHANNELS.meeting(meetingId),
      EVENTS.AGENDA_ITEM_DELETED,
      {
        itemId,
        deletedBy: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        timestamp: new Date().toISOString()
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Agenda item deleted successfully'
    });

  } catch (error: unknown) {
    console.error('Error deleting agenda item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { isAnyAdmin } from '@/lib/auth/policy';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: Props) {
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
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    // Check if user has access to this meeting
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        meeting_attendee: {
          where: { staff_id: (user.staff as any)?.id || -1 }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const hasAdminAccess = isAnyAdmin(user);
    const isOrganizer = meeting.organizer_id === (user.staff as any)?.id;
    const isAttendee = meeting.meeting_attendee.length > 0;

    if (!hasAdminAccess && !isOrganizer && !isAttendee) {
      return NextResponse.json({ error: 'Not authorized to view this meeting history' }, { status: 403 });
    }

    // Fetch meeting audit logs and related activity
    const [auditLogs, agendaItemUpdates, actionItemUpdates] = await Promise.all([
      // Meeting audit logs
      prisma.meeting_audit_logs.findMany({
        where: { meeting_id: meetingId },
        include: {
          users: {
            select: { id: true, name: true, email: true }
          },
          staff: {
            include: {
              users: { select: { id: true, name: true, email: true } }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 50
      }),

      // Agenda item activity (recent updates via updated_at timestamps)
      prisma.meeting_agenda_items.findMany({
        where: { 
          meeting_id: meetingId,
          updated_at: {
            not: undefined
          }
        },
        select: {
          id: true,
          topic: true,
          status: true,
          updated_at: true,
          staff: {
            include: {
              users: { select: { id: true, name: true, email: true } }
            }
          }
        },
        orderBy: { updated_at: 'desc' },
        take: 20
      }),

      // Action items activity
      prisma.meeting_action_items.findMany({
        where: { meeting_id: meetingId },
        select: {
          id: true,
          title: true,
          status: true,
          updated_at: true,
          created_at: true,
          staff_meeting_action_items_assigned_toTostaff: {
            include: {
              users: { select: { id: true, name: true, email: true } }
            }
          }
        },
        orderBy: { updated_at: 'desc' },
        take: 20
      })
    ]);

    // Combine and format all activities
    const activities = [
      // Audit logs
      ...auditLogs.map(log => ({
        id: `audit_${log.id}`,
        type: 'audit' as const,
        action: log.action,
        details: log.details,
        timestamp: log.created_at,
        user: {
          name: log.staff?.users?.name || log.users?.name || 'Unknown',
          email: log.staff?.users?.email || log.users?.email || 'unknown@email.com'
        },
        changes: log.changes
      })),

      // Agenda item updates
      ...agendaItemUpdates.map(item => ({
        id: `agenda_${item.id}`,
        type: 'agenda_update' as const,
        action: 'UPDATE_AGENDA_ITEM',
        details: `Updated agenda item: ${item.topic}`,
        timestamp: item.updated_at,
        user: {
          name: item.staff?.users?.name || 'Unknown',
          email: item.staff?.users?.email || 'unknown@email.com'
        },
        metadata: {
          item_id: item.id,
          topic: item.topic,
          status: item.status
        }
      })),

      // Action item updates
      ...actionItemUpdates.map(item => ({
        id: `action_${item.id}`,
        type: 'action_update' as const,
        action: 'UPDATE_ACTION_ITEM',
        details: `Updated action item: ${item.title}`,
        timestamp: item.updated_at || item.created_at,
        user: {
          name: item.staff_meeting_action_items_assigned_toTostaff?.users?.name || 'Unknown',
          email: item.staff_meeting_action_items_assigned_toTostaff?.users?.email || 'unknown@email.com'
        },
        metadata: {
          item_id: item.id,
          title: item.title,
          status: item.status
        }
      }))
    ];

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, 30), // Return top 30 most recent activities
      total: activities.length
    });

  } catch (error: unknown) {
    console.error('Error fetching meeting history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
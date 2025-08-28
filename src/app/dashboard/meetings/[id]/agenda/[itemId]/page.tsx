import { requireAuth, AuthPresets, type AuthenticatedUser } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AgendaItemDetail } from '@/components/meetings/AgendaItemDetail';
import { isAnyAdmin } from '@/lib/auth/policy';

interface Props {
  params: Promise<{ id: string; itemId: string }>;
}

export default async function AgendaItemPage(props: Props) {
  const user = await requireAuth(AuthPresets.requireAuth);
  const params = await (props as unknown as { params: Promise<{ id: string; itemId: string }> }).params;

  const meetingId = parseInt(params.id);
  const itemId = parseInt(params.itemId);

  if (isNaN(meetingId) || isNaN(itemId)) {
    notFound();
  }

  // Fetch agenda item with all relations
  const agendaItem = await prisma.meeting_agenda_items.findUnique({
    where: { id: itemId },
    include: {
      meeting: {
        include: {
          department: true,
          staff: {
            include: {
              users: true,
              role: true
            }
          },
          meeting_attendee: {
            where: { staff_id: user.staff?.id || -1 }
          }
        }
      },
      staff: {
        include: {
          users: true,
          role: true,
          department: true
        }
      },
      agenda_item_comments: {
        include: {
          staff: {
            include: {
              users: true,
              role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      },
      meeting_action_items: {
        include: {
          staff_meeting_action_items_assigned_toTostaff: {
            include: {
              users: true,
              role: true
            }
          }
        }
      },
      agenda_item_attachments: true
    }
  });

  if (!agendaItem || agendaItem.meeting_id !== meetingId) {
    notFound();
  }

  // Check permissions
  const isOrganizer = agendaItem.meeting.organizer_id === user.staff?.id;
  const isAttendee = agendaItem.meeting.meeting_attendee.length > 0;
  const hasAdminAccess = isAnyAdmin(user);
  const isResponsible = agendaItem.responsible_staff_id === user.staff?.id;

  if (!isOrganizer && !isAttendee && !hasAdminAccess) {
    notFound();
  }

  // Get all staff for assignment
  const allStaff = await prisma.staff.findMany({
    include: {
      users: true,
      role: true,
      department: true
    }
  });

  return (
    <AgendaItemDetail
      item={agendaItem as any}
      meeting={agendaItem.meeting as any}
      currentUser={user}
      allStaff={allStaff as any}
      canEdit={isOrganizer ?? (hasAdminAccess || isResponsible)}
    />
  );
}
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AgendaItemDetail } from '@/components/meetings/AgendaItemDetail';
import { isAnyAdmin } from '@/lib/auth/policy';

interface Props {
  params: Promise<{ id: string; itemId: string }>;
}

export default async function AgendaItemPage(props: Props) {
  const user = await requireAuth(AuthPresets.requireAuth);
  const params = await props.params;

  const meetingId = parseInt(params.id);
  const itemId = parseInt(params.itemId);

  if (isNaN(meetingId) || isNaN(itemId)) {
    notFound();
  }

  // Fetch agenda item with all relations
  const agendaItem = await prisma.meetingAgendaItem.findUnique({
    where: { id: itemId },
    include: {
      Meeting: {
        include: {
          Department: true,
          Staff: {
            include: {
              User: true,
              Role: true
            }
          },
          MeetingAttendee: {
            where: { staff_id: user.staff?.id || -1 }
          }
        }
      },
      ResponsibleStaff: {
        include: {
          User: true,
          Role: true,
          Department: true
        }
      },
      Comments: {
        include: {
          Staff: {
            include: {
              User: true,
              Role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      },
      ActionItems: {
        include: {
          AssignedTo: {
            include: {
              User: true,
              Role: true
            }
          }
        }
      },
      Attachments: true
    }
  });

  if (!agendaItem || agendaItem.meeting_id !== meetingId) {
    notFound();
  }

  // Check permissions
  const isOrganizer = agendaItem.Meeting.organizer_id === user.staff?.id;
  const isAttendee = agendaItem.Meeting.MeetingAttendee.length > 0;
  const hasAdminAccess = isAnyAdmin(user);
  const isResponsible = agendaItem.responsible_staff_id === user.staff?.id;

  if (!isOrganizer && !isAttendee && !hasAdminAccess) {
    notFound();
  }

  // Get all staff for assignment
  const allStaff = await prisma.staff.findMany({
    include: {
      User: true,
      Role: true,
      Department: true
    }
  });

  return (
    <AgendaItemDetail
      item={agendaItem}
      meeting={agendaItem.Meeting}
      currentUser={user}
      allStaff={allStaff}
      canEdit={isOrganizer || hasAdminAccess || isResponsible}
    />
  );
}
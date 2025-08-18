import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AgendaItemsEditor } from "@/components/meetings/AgendaItemsEditor";
import { isAnyAdmin } from '@/lib/auth/policy';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingAgendaPage({ params }: PageProps) {
  // Require staff membership to edit agenda items
  const user = await requireAuth(AuthPresets.requireStaff);

  if (!user.staff) {
    throw new Error("Staff record not found");
  }

  const { id } = await params;

  // Convert string ID to integer for Prisma
  const meetingId = parseInt(id);
  if (isNaN(meetingId)) {
    redirect("/dashboard/meetings");
  }

  // Fetch meeting with agenda items
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      Staff: {
        include: {
          User: true,
          Role: true
        }
      },
      Department: true,
      MeetingAgendaItems: {
        include: {
          ResponsibleStaff: {
            include: {
              User: true,
              Role: true
            }
          }
        },
        orderBy: {
          order_index: 'asc'
        }
      },
      MeetingAttendee: {
        include: {
          Staff: {
            include: {
              User: true,
              Role: true,
              Department: true
            }
          }
        }
      }
    },
  });

  if (!meeting) {
    redirect("/dashboard/meetings");
  }

  // Check if user has permission to edit this meeting's agenda
  const hasAdminAccess = isAnyAdmin(user);
  const isOrganizer = meeting.organizer_id === user.staff?.id;
  const isAttendee = meeting.MeetingAttendee.some(a => a.staff_id === user.staff?.id);

  if (!hasAdminAccess && !isOrganizer && !isAttendee) {
    redirect("/dashboard/meetings");
  }

  // Get all staff for responsible person dropdown
  const allStaff = await prisma.staff.findMany({
    where: {
      OR: [
        // Same department
        { department_id: user.staff?.department?.id },
        // Leadership roles from same school
        { 
          school_id: user.staff?.school?.id,
          Role: {
            is_leadership: true
          }
        },
        // Meeting attendees
        {
          id: {
            in: meeting.MeetingAttendee.map(a => a.staff_id)
          }
        }
      ]
    },
    include: {
      User: true,
      Role: true,
      Department: true
    },
    take: 200 // Limit for performance
  });

  // Get past meetings for importing agenda items
  const pastMeetings = await prisma.meeting.findMany({
    where: {
      id: {
        not: meetingId
      },
      OR: [
        { organizer_id: user.staff?.id },
        { department_id: user.staff?.department?.id },
        {
          MeetingAttendee: {
            some: {
              staff_id: user.staff?.id
            }
          }
        }
      ],
      MeetingAgendaItems: {
        some: {} // Only meetings with agenda items
      }
    },
    select: {
      id: true,
      title: true,
      start_time: true,
      _count: {
        select: {
          MeetingAgendaItems: true
        }
      }
    },
    orderBy: {
      start_time: 'desc'
    },
    take: 20 // Last 20 meetings
  });

  // Transform staff data to match the component's expected format
  const staffForAgenda = allStaff.map(staff => ({
    id: staff.id,
    name: staff.User.name || staff.User.email || 'Unknown',
    initials: staff.User.name?.split(' ').map(n => n[0]).join('').toUpperCase()
  }));

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <AgendaItemsEditor
        meeting={meeting}
        currentUser={user}
        allStaff={staffForAgenda}
        pastMeetings={pastMeetings}
        canEdit={hasAdminAccess || isOrganizer}
      />
    </div>
  );
}
import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import type { UserWithstaff, SessionUser } from '@/types/auth';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MeetingLiveView } from "@/components/meetings/MeetingLiveView";
import { isAnyAdmin } from '@/lib/auth/policy';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MeetingLivePage(props: Props) {
  const params = await props.params;
  const user = await requireAuth(AuthPresets.requireStaff);
  
  if (!params?.id) {
    notFound();
  }
  
  const meetingId = parseInt(params.id);
  if (isNaN(meetingId)) {
    notFound();
  }

  // Fetch meeting with minimal data first
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      department: true,
      district: true,
      school: true,
      staff: {
        include: {
          users: true,
          role: true
        }
      }
    }
  });

  if (!meeting) {
    notFound();
  }

  // Check if user is authorized - do a separate simple query
  const attendeeCheck = await prisma.meetingAttendee.findFirst({
    where: {
      meeting_id: meetingId,
      staff_id: user.staff?.id || -1
    }
  });

  const isOrganizer = meeting.organizer_id === user.staff?.id;
  const isAttendee = !!attendeeCheck;
  const hasAdminAccess = isAnyAdmin(user);

  if (!isOrganizer && !isAttendee && !hasAdminAccess) {
    notFound();
  }

  // Fetch attendees separately with less nesting
  const attendees = await prisma.meetingAttendee.findMany({
    where: { meeting_id: meetingId },
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

  // Fetch agenda items separately with less nesting
  const agendaItems = await prisma.meetingAgendaItem.findMany({
    where: { meeting_id: meetingId },
    select: {
      id: true,
      topic: true,
      problem_statement: true,
      staff_initials: true,
      order_index: true,
      status: true,
      responsible_staff_id: true,
      duration_minutes: true,
      priority: true,
      purpose: true,
      responsible_staff: {
        include: {
          users: true
        }
      },
      _count: {
        select: {
          comments: true,
          action_items: true
        }
      }
    },
    orderBy: {
      order_index: 'asc'
    }
  });

  // Fetch action items separately
  const actionItems = await prisma.meetingActionItem.findMany({
    where: { meeting_id: meetingId },
    include: {
      AssignedTo: {
        include: {
          users: true,
          role: true
        }
      }
    }
  });

  // Combine the data
  const fullMeeting = {
    ...meeting,
    MeetingAttendee: attendees,
    MeetingAgendaItems: agendaItems,
    MeetingActionItems: actionItems
  };

  // Get only relevant staff for assignment dropdowns (same department/school)
  const allStaff = await prisma.staff.findMany({
    where: {
      OR: [
        // Same department
        { department_id: user.staff?.department?.id },
        // Leadership roles from same school
        { 
          school_id: user.staff?.school?.id,
          role: {
            is_leadership: true
          }
        }
      ]
    },
    select: {
      id: true,
      users: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      role: {
        select: {
          id: true,
          title: true
        }
      },
      department: {
        select: {
          id: true,
          name: true
        }
      }
    },
    take: 50 // Limit to 50 staff for performance
  });

  return (
    <div className="min-h-screen bg-muted">
      <MeetingLiveView
        meeting={fullMeeting}
        currentUser={user}
        allStaff={allStaff}
        isOrganizer={isOrganizer}
        isAdmin={hasAdminAccess}
      />
    </div>
  );
}
import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import type { UserWithStaff, SessionUser } from '@/types/auth';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MeetingLiveView } from "@/components/meetings/MeetingLiveView";
import { isAnyAdmin } from '@/lib/auth/policy';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MeetingLivePage(props: Props) {
  const params = await (props as unknown as { params: Promise<{ id: string }> }).params;
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
  const attendeeCheck = await prisma.meeting_attendee.findFirst({
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

  // Fetch all meeting data in one optimized query using Promise.all
  const [attendees, agendaItems, actionItems] = await Promise.all([
    // Fetch attendees with minimal required data
    prisma.meeting_attendee.findMany({
      where: { meeting_id: meetingId },
      select: {
        id: true,
        status: true,
        staff_id: true,
        staff: {
          select: {
            id: true,
            users: {
              select: { id: true, name: true, email: true }
            },
            role: {
              select: { id: true, title: true }
            },
            department: {
              select: { id: true, name: true }
            }
          }
        }
      }
    }),

    // Fetch agenda items with minimal data
    prisma.meeting_agenda_items.findMany({
      where: { meeting_id: meetingId },
      select: {
        id: true,
        topic: true,
        problem_statement: true,
        proposed_solution: true,
        decisions_actions: true,
        solution_type: true,
        decision_type: true,
        future_implications: true,
        staff_initials: true,
        order_index: true,
        status: true,
        responsible_staff_id: true,
        duration_minutes: true,
        priority: true,
        purpose: true,
        created_at: true,
        updated_at: true,
        staff: {
          select: {
            id: true,
            users: { select: { id: true, name: true, email: true } }
          }
        },
        agenda_item_comments: {
          select: {
            id: true,
            comment: true,
            created_at: true,
            staff: {
              select: {
                users: { select: { id: true, name: true, email: true } }
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 10
        },
        _count: {
          select: {
            agenda_item_comments: true,
            meeting_action_items: true
          }
        }
      },
      orderBy: { order_index: 'asc' },
      take: 50 // Limit for performance
    }),

    // Fetch action items with minimal data
    prisma.meeting_action_items.findMany({
      where: { meeting_id: meetingId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        due_date: true,
        created_at: true,
        updated_at: true,
        assigned_to: true,
        staff_meeting_action_items_assigned_toTostaff: {
          select: {
            id: true,
            users: { select: { id: true, name: true, email: true } },
            role: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 100 // Limit for performance
    }),
  ]);

  // Combine the data
  const fullMeeting = {
    ...meeting,
    meeting_attendee: attendees,
    meeting_agenda_items: agendaItems,
    meeting_action_items: actionItems
  };

  // Get only relevant staff for assignment dropdowns (same department/school)
  // Only fetch if user is organizer or admin (can assign tasks)
  const allStaff = (isOrganizer || hasAdminAccess) ? await prisma.staff.findMany({
    where: {
      OR: [
        // Same department
        { department_id: user.staff?.department?.id },
        // Leadership roles from same school
        { 
          school_id: user.staff?.school?.id,
          role: { is_leadership: true }
        }
      ]
    },
    select: {
      id: true,
      users: {
        select: { id: true, name: true, email: true }
      },
      role: {
        select: { id: true, title: true }
      },
      department: {
        select: { id: true, name: true }
      }
    },
    orderBy: { users: { name: 'asc' } },
    take: 30 // Reduced limit for better performance
  }) : [];

  return (
    <div className="min-h-screen bg-muted">
      <MeetingLiveView
        meeting={fullMeeting as any}
        currentUser={user}
        allStaff={allStaff as any}
        isOrganizer={isOrganizer}
        isAdmin={hasAdminAccess}
      />
    </div>
  );
}
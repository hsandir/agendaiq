import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import type { UserWithStaff, SessionUser } from '@/types/auth';
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MeetingEditForm } from "./MeetingEditForm";
import { isAnyAdmin } from '@/lib/auth/policy';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMeetingPage({ params }: PageProps) {
  // Require staff membership to edit meetings
  const user = await requireAuth(AuthPresets.requireStaff);

  if (!user.staff) {
    throw new Error("Staff record not found");
  }

  // Safely resolve params
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    redirect("/dashboard/meetings");
  }

  // Convert string ID to integer for Prisma
  const meetingId = parseInt(id);
  if (isNaN(meetingId)) {
    redirect("/dashboard/meetings");
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      Staff: {
        include: {
          User: true
        }
      },
      MeetingAttendee: {
        include: {
          Staff: {
            include: {
              User: true
            }
          }
        }
      },
      MeetingAgendaItems: {
        orderBy: {
          order_index: 'asc'
        }
      }
    },
  });

  if (!meeting) {
    redirect("/dashboard/meetings");
  }

  // Check if user has permission to edit this meeting
  const hasAdminAccess = isAnyAdmin(user);
  const isOrganizer = meeting.organizer_id === user.staff?.id;

  if (!hasAdminAccess && !isOrganizer) {
    redirect("/dashboard/meetings");
  }

  // Get relevant staff for attendees dropdown (same department/school + leadership)
  const allStaff = await prisma.staff.findMany({
    where: {
      NOT: {
        user_id: user.id,
      },
      OR: [
        // Same department
        { department_id: user.staff?.department?.id },
        // Leadership roles from same school
        { 
          school_id: user.staff?.school?.id,
          Role: {
            is_leadership: true
          }
        }
      ]
    },
    select: {
      id: true,
      User: {
        select: {
          name: true,
          email: true
        }
      },
      Role: {
        select: {
          key: true
        }
      },
      Department: {
        select: {
          name: true
        }
      }
    },
    take: 100 // Limit for performance
  });

  const transformedUsers = (allStaff.map(staff => ({
    id: staff.id.toString(),
    name: staff.User.name ?? staff.User.email ?? '',
    email: staff.User.email ?? '',
    role: staff.Role.key ?? 'UNKNOWN_ROLE',
    department: staff.Department.name
  })));

  // Check if this is a draft meeting (Step 2) or existing meeting (edit)
  const isStep2 = meeting.status === 'draft';

  // Transform meeting data for the form
  const transformedMeeting = {
    id: meeting.id.toString(),
    title: meeting.title,
    description: meeting.description ?? '',
    startTime: meeting.start_time?.toISOString() ?? '',
    endTime: meeting.end_time?.toISOString() ?? '',
    agenda: meeting.agenda ?? '',
    notes: meeting.notes ?? '',
    status: meeting.status ?? 'draft',
    type: meeting.meeting_type ?? 'regular',
    location: '', // Meeting model doesn't have location field
    zoomLink: meeting.zoom_join_url ?? '',
    zoomMeetingId: meeting.zoom_meeting_id ?? '',
    calendarIntegration: meeting.calendar_integration ?? 'none',
    attendees: meeting.MeetingAttendee.map(attendee => ({
      id: attendee.Staff.id.toString(),
      name: attendee.Staff.User.name ?? attendee.Staff.User.email ?? '',
      email: attendee.Staff.User.email ?? '',
      status: attendee.status ?? 'pending'
    })),
    agendaItems: meeting.MeetingAgendaItems.map(item => ({
      id: item.id.toString(),
      topic: item.topic,
      description: item.problem_statement ?? '',
      purpose: item.purpose ?? 'Discussion',
      priority: item.priority ?? 'Medium',
      duration_minutes: item.duration_minutes ?? 15,
      responsible_staff_id: item.responsible_staff_id?.toString() || null,
      status: item.status ?? 'Pending',
      order_index: item.order_index
    }))
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {isStep2 ? "Create New Meeting - Step 2" : "Edit Meeting"}
        </h1>
        <p className="text-muted-foreground">
          {isStep2 
            ? "Set up agenda, notes, and finalize your meeting"
            : "Update meeting details, agenda, and content"
          }
        </p>
      </div>
      
      <div className="bg-card shadow-sm rounded-lg">
        <div className="px-6 py-6">
          <MeetingEditForm 
            meeting={transformedMeeting}
            users={transformedUsers}
            meetingId={meetingId}
            isStep2={isStep2}
          />
        </div>
      </div>
    </div>
  );
} 
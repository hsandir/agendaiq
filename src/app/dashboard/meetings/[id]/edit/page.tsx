import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MeetingEditForm } from "./MeetingEditForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMeetingPage({ params }: PageProps) {
  // Require staff membership to edit meetings
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
      }
    },
  });

  if (!meeting) {
    redirect("/dashboard/meetings");
  }

  // Check if user has permission to edit this meeting
  const isAdmin = user.staff.role.title === 'Administrator';
  const isOrganizer = meeting.organizer_id === user.staff.id;

  if (!isAdmin && !isOrganizer) {
    redirect("/dashboard/meetings");
  }

  // Get all staff users for the attendees dropdown (in case they want to modify attendees)
  const allStaff = await prisma.staff.findMany({
    where: {
      NOT: {
        user_id: user.id,
      }
    },
    include: {
      User: true,
      Role: true,
      Department: true
    }
  });

  const transformedUsers = allStaff.map(staff => ({
    id: staff.id.toString(),
    name: staff.User.name || staff.User.email || '',
    email: staff.User.email || '',
    role: staff.Role.title,
    department: staff.Department.name
  }));

  // Check if this is a draft meeting (Step 2) or existing meeting (edit)
  const isStep2 = meeting.status === 'draft';

  // Transform meeting data for the form
  const transformedMeeting = {
    id: meeting.id.toString(),
    title: meeting.title,
    description: meeting.description || '',
    startTime: meeting.start_time?.toISOString() || '',
    endTime: meeting.end_time?.toISOString() || '',
    agenda: meeting.agenda || '',
    notes: meeting.notes || '',
    status: meeting.status || 'draft',
    attendees: meeting.MeetingAttendee.map(attendee => ({
      id: attendee.Staff.id.toString(),
      name: attendee.Staff.User.name || attendee.Staff.User.email || '',
      email: attendee.Staff.User.email || '',
      status: attendee.status
    }))
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isStep2 ? "Create New Meeting - Step 2" : "Edit Meeting"}
        </h1>
        <p className="text-gray-600">
          {isStep2 
            ? "Set up agenda, notes, and finalize your meeting"
            : "Update meeting details, agenda, and content"
          }
        </p>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg">
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
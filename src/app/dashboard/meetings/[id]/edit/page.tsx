import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

  async function updateMeeting(data: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    attendeeIds?: string[];
    agenda?: string;
    notes?: string;
    status?: string;
  }) {
    "use server";

    // Get current user again for the server action
    const currentUser = await requireAuth(AuthPresets.requireStaff);
    
    if (!currentUser.staff) {
      throw new Error("Staff record not found");
    }

    const currentStaff = currentUser.staff;
    const isAdmin = currentStaff.role.title === 'Administrator';

    // Check permissions
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { MeetingAttendee: true }
    });

    if (!existingMeeting) {
      throw new Error("Meeting not found");
    }

    if (!isAdmin && existingMeeting.organizer_id !== currentStaff.id) {
      throw new Error("Not authorized to edit this meeting");
    }

    // Store old values for audit log
    const oldValues = {
      title: existingMeeting.title,
      description: existingMeeting.description,
      start_time: existingMeeting.start_time,
      end_time: existingMeeting.end_time,
      agenda: existingMeeting.agenda,
      notes: existingMeeting.notes,
      status: existingMeeting.status,
      attendee_count: existingMeeting.MeetingAttendee.length
    };

    // Prepare update data
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime !== undefined) updateData.start_time = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.end_time = new Date(data.endTime);
    if (data.agenda !== undefined) updateData.agenda = data.agenda;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    // Handle attendees update if provided
    if (data.attendeeIds !== undefined) {
      updateData.MeetingAttendee = {
        deleteMany: {},
        create: data.attendeeIds.map((staffId: string) => ({
          staff_id: parseInt(staffId),
          status: "pending",
        })),
      };
    }

    // Update meeting
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: updateData,
    });

    // Create audit log entry for meeting update
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: updatedMeeting.id,
        user_id: currentUser.id,
        action: isStep2 ? "completed_step_2" : "updated",
        details: {
          old_values: oldValues,
          new_values: {
            title: updatedMeeting.title,
            description: updatedMeeting.description,
            start_time: updatedMeeting.start_time,
            end_time: updatedMeeting.end_time,
            agenda: updatedMeeting.agenda,
            notes: updatedMeeting.notes,
            status: updatedMeeting.status,
            attendee_count: data.attendeeIds?.length || oldValues.attendee_count
          }
        }
      }
    });

    return updatedMeeting;
  }

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
            meeting={{
              id: meeting.id.toString(),
              title: meeting.title,
              description: meeting.description || '',
              startTime: meeting.start_time ? new Date(meeting.start_time).toISOString().slice(0, 16) : '',
              endTime: meeting.end_time ? new Date(meeting.end_time).toISOString().slice(0, 16) : '',
              agenda: meeting.agenda || '',
              notes: meeting.notes || '',
              status: meeting.status,
              attendeeIds: meeting.MeetingAttendee.map(attendee => attendee.staff_id.toString()),
              meetingType: meeting.meeting_type || 'regular',
              repeatType: meeting.repeat_type || 'none',
              calendarIntegration: meeting.calendar_integration || 'none',
              zoomMeetingId: meeting.zoom_meeting_id || '',
              isContinuation: meeting.is_continuation,
              parentMeetingId: meeting.parent_meeting_id
            }}
            users={transformedUsers}
            onSubmit={updateMeeting}
            isStep2={isStep2}
          />
        </div>
      </div>
    </div>
  );
}

// Step 2 / Edit Form Component
function MeetingEditForm({ 
  meeting, 
  users, 
  onSubmit, 
  isStep2 
}: {
  meeting: any;
  users: any[];
  onSubmit: (data: any) => Promise<any>;
  isStep2: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Meeting Information Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Meeting Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Title:</span> {meeting.title}
          </div>
          <div>
            <span className="font-medium">Type:</span> {meeting.meetingType}
          </div>
          <div>
            <span className="font-medium">Start:</span> {new Date(meeting.startTime).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">End:</span> {new Date(meeting.endTime).toLocaleString()}
          </div>
        </div>
        {meeting.description && (
          <div className="mt-2">
            <span className="font-medium">Description:</span> {meeting.description}
          </div>
        )}
      </div>

      {/* Agenda and Content Form */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        await onSubmit({
          agenda: formData.get('agenda') as string,
          notes: formData.get('notes') as string,
          status: isStep2 ? 'scheduled' : meeting.status
        });
        
        // Redirect after successful update
        window.location.href = '/dashboard/meetings';
      }} className="space-y-6">
        
        <div>
          <label htmlFor="agenda" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Agenda
          </label>
          <textarea
            id="agenda"
            name="agenda"
            rows={6}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter meeting agenda items..."
            defaultValue={meeting.agenda}
          />
          <p className="mt-1 text-sm text-gray-500">
            List the topics and items to be discussed in this meeting
          </p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Notes & Preparation
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Add any preparation notes or additional information..."
            defaultValue={meeting.notes}
          />
          <p className="mt-1 text-sm text-gray-500">
            Add any preparation notes, background information, or additional details
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isStep2 ? 'Back to Step 1' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isStep2 ? 'Create Meeting' : 'Update Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
} 
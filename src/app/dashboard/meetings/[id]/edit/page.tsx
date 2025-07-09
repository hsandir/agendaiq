import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MeetingForm } from "@/components/meetings/MeetingForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMeetingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
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
      organizer: {
        include: {
          user: true
        }
      },
      attendees: {
        include: {
          staff: {
            include: {
              user: true
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
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
    include: {
      staff: {
        include: {
          role: true
        }
      }
    }
  });

  const userStaffId = currentUser?.staff?.[0]?.id;
  const isAdmin = currentUser?.staff?.[0]?.role?.title === 'Administrator';
  const isOrganizer = meeting.organizer_id === userStaffId;

  if (!isAdmin && !isOrganizer) {
    redirect("/dashboard/meetings");
  }

  // Get all staff users for the attendees dropdown
  const users = await prisma.user.findMany({
    where: {
      staff: {
        some: {}
      }
    },
    include: {
      staff: {
        include: {
          role: true
        }
      }
    }
  });

  const transformedUsers = users.map(user => ({
    id: user.staff[0]?.id.toString() || '',
    name: user.name || user.email || '',
    email: user.email || ''
  }));

  // Prepare initial data from the meeting
  const initialData = {
    title: meeting.title,
    description: meeting.description || '',
    startTime: meeting.start_time ? new Date(meeting.start_time).toISOString().slice(0, 16) : '',
    endTime: meeting.end_time ? new Date(meeting.end_time).toISOString().slice(0, 16) : '',
    attendeeIds: meeting.attendees.map(attendee => attendee.staff_id.toString())
  };

  async function updateMeeting(data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    attendeeIds: string[];
  }) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        staff: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || !user.staff || user.staff.length === 0) {
      throw new Error("Staff record not found");
    }

    const staffRecord = user.staff[0];
    const isAdmin = staffRecord.role?.title === 'Administrator';

    // Check permissions
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { attendees: true }
    });

    if (!existingMeeting) {
      throw new Error("Meeting not found");
    }

    if (!isAdmin && existingMeeting.organizer_id !== staffRecord.id) {
      throw new Error("Not authorized to edit this meeting");
    }

    // Store old values for audit log
    const oldValues = {
      title: existingMeeting.title,
      description: existingMeeting.description,
      start_time: existingMeeting.start_time,
      end_time: existingMeeting.end_time,
      attendee_count: existingMeeting.attendees.length
    };

    // Update meeting
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title: data.title,
        description: data.description,
        start_time: new Date(data.startTime),
        end_time: new Date(data.endTime),
        attendees: {
          deleteMany: {},
          create: data.attendeeIds.map((staffId: string) => ({
            staff_id: parseInt(staffId),
            status: "pending",
          })),
        },
      },
    });

    // Create audit log entry for meeting update
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: updatedMeeting.id,
        user_id: user.id,
        action: "updated",
        details: {
          old_values: oldValues,
          new_values: {
            title: updatedMeeting.title,
            description: updatedMeeting.description,
            start_time: updatedMeeting.start_time,
            end_time: updatedMeeting.end_time,
            attendee_count: data.attendeeIds.length
          }
        }
      }
    });

    return updatedMeeting;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Meeting</h1>
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <MeetingForm 
            users={transformedUsers} 
            onSubmit={updateMeeting}
            initialData={initialData}
          />
        </div>
      </div>
    </div>
  );
} 
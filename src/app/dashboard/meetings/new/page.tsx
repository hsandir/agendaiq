import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MeetingForm } from "@/components/meetings/MeetingForm";
import { redirect } from "next/navigation";

export default async function NewMeetingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const currentUserId = parseInt(session.user.id || '0');

  // Fetch current user's staff record to get staff_id
  const currentUserStaff = await prisma.staff.findFirst({
    where: { user_id: currentUserId },
    include: { user: true }
  });

  if (!currentUserStaff) {
    redirect("/dashboard");
  }

  // Fetch all staff except the current user, with their user info
  const staff = await prisma.staff.findMany({
    where: {
      NOT: {
        user_id: currentUserId,
      },
    },
    include: {
      user: true
    },
    orderBy: {
      user: {
        name: "asc",
      }
    },
  });

  // Transform staff data to match MeetingForm interface
  const users = staff.map(s => ({
    id: s.id.toString(), // Use staff ID, not user ID
    name: s.user.name,
    email: s.user.email,
  }));

  async function createMeeting(data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    attendeeIds: string[];
  }) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Not authenticated");
    }

    const currentUserId = parseInt(session.user.id || '0');
    const currentUserStaff = await prisma.staff.findFirst({
      where: { user_id: currentUserId }
    });

    if (!currentUserStaff) {
      throw new Error("Staff record not found");
    }

    // Get the user record for audit logging
    const user = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!user) {
      throw new Error("User record not found");
    }

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description || "",
        start_time: new Date(data.startTime),
        end_time: new Date(data.endTime),
        organizer_id: currentUserStaff.id,
        department_id: currentUserStaff.department_id,
        school_id: currentUserStaff.school_id,
        district_id: currentUserStaff.district_id,
        attendees: {
          create: data.attendeeIds.map((staffId) => ({
            staff_id: parseInt(staffId),
            status: "PENDING",
          })),
        },
      },
    });

    // Create audit log entry for meeting creation
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: meeting.id,
        user_id: user.id,
        action: "created",
        details: {
          title: meeting.title,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          attendee_count: data.attendeeIds.length
        }
      }
    });

    return meeting;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Meeting</h1>
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <MeetingForm users={users} onSubmit={createMeeting} />
        </div>
      </div>
    </div>
  );
} 
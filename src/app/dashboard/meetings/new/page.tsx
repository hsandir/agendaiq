import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { MeetingForm } from "@/components/meetings/MeetingForm";

export default async function NewMeetingPage() {
  // Require staff membership to create meetings
  const user = await requireAuth(AuthPresets.requireStaff);

  if (!user.staff) {
    throw new Error("Staff record not found");
  }

  const currentStaff = user.staff;

  // Fetch all staff except the current user, with their user info
  const staff = await prisma.staff.findMany({
    where: {
      NOT: {
        user_id: user.id,
      },
    },
    include: {
      User: true
    },
    orderBy: {
      User: {
        name: "asc",
      }
    },
  });

  // Transform staff data to match MeetingForm interface
  const users = staff.map(s => ({
    id: s.id.toString(), // Use staff ID, not user ID
    name: s.User.name,
    email: s.User.email,
  }));

  async function createMeeting(data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    attendeeIds: string[];
  }) {
    "use server";

    // Get current user again for the server action
    const currentUser = await requireAuth(AuthPresets.requireStaff);
    
    if (!currentUser.staff) {
      throw new Error("Staff record not found");
    }

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description || "",
        start_time: new Date(data.startTime),
        end_time: new Date(data.endTime),
        organizer_id: currentUser.staff.id,
        department_id: currentUser.staff.department.id,
        school_id: currentUser.staff.school.id,
        district_id: currentUser.staff.district.id,
        MeetingAttendee: {
          create: data.attendeeIds.map((staffId) => ({
            staff_id: parseInt(staffId),
            status: "pending",
          })),
        },
      },
    });

    // Create audit log entry for meeting creation
    await prisma.meetingAuditLog.create({
      data: {
        meeting_id: meeting.id,
        user_id: currentUser.id,
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
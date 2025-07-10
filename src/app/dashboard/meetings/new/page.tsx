import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { MeetingFormStep1 } from "@/components/meetings/MeetingFormStep1";
import { revalidatePath } from "next/cache";

export default async function NewMeetingPage() {
  // Require staff membership to create meetings
  const user = await requireAuth(AuthPresets.requireStaff);

  if (!user.staff) {
    throw new Error("Staff record not found");
  }

  const currentStaff = user.staff;

  // Fetch all staff except the current user, with their user info and additional details
  const staff = await prisma.staff.findMany({
    where: {
      NOT: {
        user_id: user.id,
      },
    },
    include: {
      User: true,
      Department: true,
      Role: true
    },
    orderBy: {
      User: {
        name: "asc",
      }
    },
  });

  // Fetch departments for filtering
  const departments = await prisma.department.findMany({
    orderBy: {
      name: "asc"
    }
  });

  // Fetch roles for filtering
  const roles = await prisma.role.findMany({
    orderBy: {
      title: "asc"
    }
  });

  // Transform staff data to match MeetingFormStep1 interface
  const users = staff.map(s => ({
    id: s.id.toString(), // Use staff ID, not user ID
    name: s.User.name || s.User.email || "Unknown User",
    email: s.User.email || "",
    department: s.Department.name,
    role: s.Role.title,
  }));

  // Transform departments
  const transformedDepartments = departments.map(d => ({
    id: d.id,
    name: d.name,
    code: d.code
  }));

  // Transform roles
  const transformedRoles = roles.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category || undefined
  }));

  async function createMeeting(data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    repeatType: string;
    repeatEndDate: string;
    calendarIntegration: string;
    meetingType: string;
    zoomMeetingId: string;
    attendeeIds: string[];
    isContinuation: boolean;
    parentMeetingId?: number;
  }) {
    "use server";

    // Get current user again for the server action
    const currentUser = await requireAuth(AuthPresets.requireStaff);
    
    if (!currentUser.staff) {
      throw new Error("Staff record not found");
    }

    try {
      // Create the meeting with all enhanced fields
      const meeting = await prisma.meeting.create({
        data: {
          title: data.title,
          description: data.description || "",
          start_time: new Date(data.startTime),
          end_time: new Date(data.endTime),
          repeat_type: data.repeatType !== "none" ? data.repeatType : null,
          calendar_integration: data.calendarIntegration !== "none" ? data.calendarIntegration : null,
          meeting_type: data.meetingType,
          zoom_meeting_id: data.zoomMeetingId || null,
          is_continuation: data.isContinuation,
          parent_meeting_id: data.parentMeetingId || null,
          status: "draft", // Start as draft, will be scheduled in step 2
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
            meeting_type: meeting.meeting_type,
            is_continuation: meeting.is_continuation,
            attendee_count: data.attendeeIds.length
          }
        }
      });

      // Revalidate the meetings page
      revalidatePath('/dashboard/meetings');

      // Return success with meeting ID for client-side redirect
      return { 
        success: true, 
        meetingId: meeting.id,
        message: "Meeting created successfully. Redirecting to step 2..." 
      };
      
    } catch (error) {
      console.error("Error creating meeting:", error);
      throw new Error("Failed to create meeting. Please try again.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Meeting - Step 1</h1>
        <p className="text-gray-600">Set up basic meeting information and select attendees</p>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-6">
          <MeetingFormStep1 
            users={users} 
            departments={transformedDepartments}
            roles={transformedRoles}
            onSubmit={createMeeting} 
          />
        </div>
      </div>
    </div>
  );
} 
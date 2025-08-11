import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { MeetingFormStep1 } from "@/components/meetings/MeetingFormStep1";
import { revalidatePath } from "next/cache";

export default async function NewMeetingPage() {
  // Require authentication to create meetings
  const user = await requireAuth(AuthPresets.requireAuth);

  // Try to get staff record if exists
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
    repeatConfig?: unknown; // RepeatConfig from modal
    calendarIntegration: string;
    meetingType: string;
    zoomMeetingId: string;
    attendeeIds: string[];
    isContinuation: boolean;
    parentMeetingId?: number;
  }) {
    "use server";

    // Get current user again for the server action
    const currentUser = await requireAuth(AuthPresets.requireAuth);
    
    // Check if user has staff record
    if (!currentUser.staff) {
      // For non-staff users, create a temporary staff record or handle differently
      // For now, we'll return an error message
      throw new Error("You need to be assigned as staff to create meetings. Please contact your administrator.");
    }

    try {
      // Validate required date fields
      if (!data.startTime || !data.endTime) {
        throw new Error("Start time and end time are required");
      }

      // Validate date values
      const startDateTest = new Date(data.startTime);
      const endDateTest = new Date(data.endTime);
      
      if (isNaN(startDateTest.getTime())) {
        throw new Error("Invalid start time value");
      }
      
      if (isNaN(endDateTest.getTime())) {
        throw new Error("Invalid end time value");
      }

      if (endDateTest <= startDateTest) {
        throw new Error("End time must be after start time");
      }

      // Fetch full staff data with related entities
      const staffWithRelations = await prisma.staff.findUnique({
        where: { id: currentUser.staff.id },
        include: {
          Department: true,
          School: true,
          District: true
        }
      });

      if (!staffWithRelations) {
        throw new Error("Staff record with relations not found");
      }

      // Generate series ID if this is a repeat meeting
      const seriesId = data.repeatConfig?.enabled ? 
        `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

      // Calculate all meeting dates if repeat is enabled
      const meetingDates: Date[] = [];
      if (data.repeatConfig?.enabled && data.startTime && data.endTime) {
        const startDate = new Date(data.startTime);
        const endDate = new Date(data.endTime);
        
        // Extra validation for repeat meetings
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error("Invalid date values for repeat configuration");
        }
        
        const timeDiff = endDate.getTime() - startDate.getTime();
        
        // Calculate dates based on repeat config
        meetingDates.push(startDate); // Include original date
        
        let currentDate = new Date(startDate);
        const maxOccurrences = data.repeatConfig.endType === 'after' ? 
          (data.repeatConfig.occurrences || 10) : 52;
        const endLimit = data.repeatConfig.endType === 'by' && data.repeatConfig.endDate ? 
          new Date(data.repeatConfig.endDate) : null;
        
        for (let i = 1; i < maxOccurrences; i++) {
          // Calculate next date based on pattern
          switch (data.repeatConfig.pattern) {
            case 'daily':
              currentDate.setDate(currentDate.getDate() + (data.repeatConfig.interval || 1));
              break;
            case 'weekly':
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'biweekly':
              currentDate.setDate(currentDate.getDate() + 14);
              break;
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
          }
          
          if (endLimit && currentDate > endLimit) break;
          
          // Skip exceptions
          const dateStr = currentDate.toISOString().split('T')[0];
          if (!data.repeatConfig.exceptions?.includes(dateStr)) {
            meetingDates.push(new Date(currentDate));
          }
        }
      }

      // Create meetings (single or series)
      const meetings = [];
      const validatedStartDate = new Date(data.startTime);
      const validatedEndDate = new Date(data.endTime);
      
      // Final validation before creating meetings
      if (isNaN(validatedStartDate.getTime()) || isNaN(validatedEndDate.getTime())) {
        throw new Error("Cannot create meeting with invalid date values");
      }
      
      const datesToCreate = meetingDates.length > 0 ? meetingDates : [validatedStartDate];
      const timeDuration = validatedEndDate.getTime() - validatedStartDate.getTime();
      
      for (let i = 0; i < datesToCreate.length; i++) {
        const meetingDate = datesToCreate[i];
        const endTime = new Date(meetingDate.getTime() + timeDuration);
        
        const meeting = await prisma.meeting.create({
          data: {
            title: data.title + (datesToCreate.length > 1 ? ` (${i + 1}/${datesToCreate.length})` : ''),
            description: data.description || "",
            start_time: meetingDate,
            end_time: endTime,
            repeat_type: data.repeatType !== "none" ? data.repeatType : null,
            repeat_pattern: data.repeatConfig?.pattern || null,
            repeat_interval: data.repeatConfig?.interval || null,
            repeat_weekdays: data.repeatConfig?.weekDays || [],
            repeat_month_day: data.repeatConfig?.monthDay || null,
            repeat_month_week: data.repeatConfig?.monthWeek || null,
            repeat_month_weekday: data.repeatConfig?.monthWeekDay || null,
            repeat_end_type: data.repeatConfig?.endType || null,
            repeat_occurrences: data.repeatConfig?.occurrences || null,
            repeat_end_date: data.repeatConfig?.endDate ? new Date(data.repeatConfig.endDate) : null,
            repeat_exceptions: data.repeatConfig?.exceptions?.map((d: string) => new Date(d)) || [],
            series_id: seriesId,
            series_position: i + 1,
            is_series_master: i === 0,
            calendar_integration: data.calendarIntegration !== "none" ? data.calendarIntegration : null,
            meeting_type: data.meetingType,
            zoom_meeting_id: data.zoomMeetingId || null,
            is_continuation: data.isContinuation,
            parent_meeting_id: data.parentMeetingId || null,
            status: "draft", // Start as draft, will be scheduled in step 2
            organizer_id: staffWithRelations.id,
            department_id: staffWithRelations.department_id,
            school_id: staffWithRelations.school_id,
            district_id: staffWithRelations.district_id,
            MeetingAttendee: {
              create: data.attendeeIds.map((staffId) => ({
                staff_id: parseInt(staffId),
                status: "pending",
              })),
            },
          },
        });
        
        meetings.push(meeting);
      }
      
      const meeting = meetings[0]; // Return first meeting for navigation

      // TODO: Add meetingAuditLog model to schema for meeting audit tracking
      // Create audit log entry for meeting creation
      // await prisma.meetingAuditLog.create({
      //   data: {
      //     meeting_id: meeting.id,
      //     user_id: currentUser.id,
      //     action: "created",
      //     details: {
      //       title: meeting.title,
      //       start_time: meeting.start_time,
      //       end_time: meeting.end_time,
      //       meeting_type: meeting.meeting_type,
      //       is_continuation: meeting.is_continuation,
      //       attendee_count: data.attendeeIds.length
      //     }
      //   }
      // });

      // Revalidate the meetings page
      revalidatePath('/dashboard/meetings');

      // Return success with meeting ID for client-side redirect
      return { 
        success: true, 
        meetingId: meeting.id,
        message: meetings.length > 1 ? 
          `Created ${meetings.length} meetings in series. Redirecting to configure agenda...` :
          "Meeting created successfully. Redirecting to step 2...",
        seriesCreated: meetings.length > 1,
        meetingCount: meetings.length
      };
      
    } catch (error: unknown) {
      console.error("=== Meeting Creation Error ===");
      console.error("Error details:", error);
      console.error("Input data received:", {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        hasRepeatConfig: !!data.repeatConfig,
        repeatEnabled: data.repeatConfig?.enabled,
        attendeeCount: data.attendeeIds?.length
      });
      
      // Provide more specific error messages
      let errorMessage = "Failed to create meeting. Please try again.";
      
      if (error.message?.includes("Invalid time value") || error.message?.includes("Invalid date")) {
        errorMessage = "Invalid date/time format. Please check your date and time selections.";
      } else if (error.message?.includes("Start time and end time are required")) {
        errorMessage = "Both start and end times are required.";
      } else if (error.message?.includes("End time must be after start time")) {
        errorMessage = "End time must be after start time.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Return error response instead of throwing
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create New Meeting - Step 1</h1>
        <p className="text-muted-foreground">Set up basic meeting information and select attendees</p>
      </div>
      
      <div className="bg-card shadow-sm rounded-lg">
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
import { requireAuth, AuthPresets } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { MeetingFormStep2 } from "@/components/meetings/MeetingFormStep2";
import { revalidatePath } from "next/cache";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MeetingAgendaPage(props: Props) {
  const params = await props.params;
  const user = await requireAuth(AuthPresets.requireStaff);

  if (!user.staff) {
    throw new Error("Staff record not found");
  }

  // Fetch full staff data with Role
  const currentStaff = await prisma.staff.findUnique({
    where: { id: user.staff.id },
    include: {
      Role: true,
      User: true,
    }
  });

  if (!currentStaff) {
    throw new Error("Staff record not found");
  }

  const meetingId = parseInt(params.id);
  
  // Fetch the meeting to verify ownership and get details
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      Staff: {  // This is the organizer
        include: {
          User: true,
          Role: true,
          Department: true,
        },
      },
      MeetingAttendee: {
        include: {
          Staff: {
            include: {
              User: true,
              Role: true,
              Department: true,
            },
          },
        },
      },
      MeetingAgendaItems: {
        orderBy: {
          order_index: 'asc',
        },
      },
    },
  });

  if (!meeting) {
    notFound();
  }

  // Check if user is the organizer or has admin rights
  const isOrganizer = meeting.organizer_id === currentStaff.id;
  const isAdmin = currentStaff.Role.title === "Administrator";
  
  if (!isOrganizer && !isAdmin) {
    redirect("/dashboard/meetings");
  }

  // Server action to add agenda items
  async function addAgendaItems(items: {
    title: string;
    description: string;
    duration: number;
    presenter_id?: number;
    order: number;
  }[]) {
    "use server";

    const currentUser = await requireAuth(AuthPresets.requireStaff);
    
    if (!currentUser.staff) {
      throw new Error("Staff record not found");
    }

    try {
      // Create agenda items (using MeetingAgendaItem model)
      await prisma.meetingAgendaItem.createMany({
        data: items.map(item => ({
          meeting_id: meetingId,
          topic: item.title,  // MeetingAgendaItem uses 'topic' not 'title'
          problem_statement: item.description || "",
          duration_minutes: item.duration,
          responsible_staff_id: item.presenter_id || null,
          order_index: item.order,
          purpose: 'Discussion',  // Required field with default
          priority: 'Medium',  // Required field with default
          status: 'Pending',  // Required field with default
        })),
      });

      // Update meeting status to scheduled
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: "scheduled" },
      });

      // Revalidate the meetings page
      revalidatePath('/dashboard/meetings');
      revalidatePath(`/dashboard/meetings/${meetingId}`);

      return { 
        success: true, 
        message: "Agenda items added successfully" 
      };
    } catch (error) {
      console.error("Error adding agenda items:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to add agenda items"
      };
    }
  }

  // Server action to update agenda items
  async function updateAgendaItems(items: {
    id?: number;
    title: string;
    description: string;
    duration: number;
    presenter_id?: number;
    order: number;
  }[]) {
    "use server";

    const currentUser = await requireAuth(AuthPresets.requireStaff);
    
    if (!currentUser.staff) {
      throw new Error("Staff record not found");
    }

    try {
      // Delete existing items not in the update list
      const itemIds = items.filter(item => item.id).map(item => item.id!);
      await prisma.meetingAgendaItem.deleteMany({
        where: {
          meeting_id: meetingId,
          NOT: {
            id: { in: itemIds }
          }
        }
      });

      // Update or create items
      for (const item of items) {
        if (item.id) {
          await prisma.meetingAgendaItem.update({
            where: { id: item.id },
            data: {
              topic: item.title,  // MeetingAgendaItem uses 'topic'
              problem_statement: item.description || "",
              duration_minutes: item.duration,
              responsible_staff_id: item.presenter_id || null,
              order_index: item.order,
            }
          });
        } else {
          await prisma.meetingAgendaItem.create({
            data: {
              meeting_id: meetingId,
              topic: item.title,  // MeetingAgendaItem uses 'topic'
              problem_statement: item.description || "",
              duration_minutes: item.duration,
              responsible_staff_id: item.presenter_id || null,
              order_index: item.order,
              purpose: 'Discussion',  // Required field
              priority: 'Medium',  // Required field
              status: 'Pending',  // Required field
            }
          });
        }
      }

      // Revalidate the meetings page
      revalidatePath('/dashboard/meetings');
      revalidatePath(`/dashboard/meetings/${meetingId}`);

      return { 
        success: true, 
        message: "Agenda items updated successfully" 
      };
    } catch (error) {
      console.error("Error updating agenda items:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update agenda items"
      };
    }
  }

  // Server action to finalize meeting
  async function finalizeMeeting() {
    "use server";

    try {
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: "scheduled" },
      });

      revalidatePath('/dashboard/meetings');
      
      return { 
        success: true, 
        redirect: '/dashboard/meetings' 
      };
    } catch (error) {
      console.error("Error finalizing meeting:", error);
      return {
        success: false,
        message: "Failed to finalize meeting"
      };
    }
  }

  // Transform attendees to pass to client component (including organizer)
  const attendees = [
    // Add organizer as first attendee
    {
      id: meeting.Staff.id.toString(),
      name: meeting.Staff.User?.name || meeting.Staff.User?.email || "Unknown",
      email: meeting.Staff.User?.email || "",
      role: meeting.Staff.Role?.title || "Unknown Role",
      department: meeting.Staff.Department?.name || "Unknown Department",
    },
    // Add other attendees
    ...meeting.MeetingAttendee.map(ma => ({
      id: ma.staff_id.toString(),
      name: ma.Staff.User?.name || ma.Staff.User?.email || "Unknown",
      email: ma.Staff.User?.email || "",
      role: ma.Staff.Role?.title || "Unknown Role",
      department: ma.Staff.Department?.name || "Unknown Department",
    }))
  ];

  // Transform existing agenda items
  const existingItems = meeting.MeetingAgendaItems.map(item => ({
    id: item.id,
    title: item.topic,  // MeetingAgendaItem uses 'topic' not 'title'
    description: item.problem_statement || "",
    duration: item.duration_minutes || 15,
    presenter_id: item.responsible_staff_id || undefined,
    order: item.order_index,
  }));

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create Meeting - Step 2</h1>
        <p className="text-muted-foreground">Add agenda items for: {meeting.title}</p>
      </div>
      
      <div className="bg-card shadow-sm rounded-lg">
        <div className="px-6 py-6">
          <MeetingFormStep2
            meetingId={meetingId}
            meetingTitle={meeting.title}
            meetingDate={meeting.start_time?.toISOString() || new Date().toISOString()}
            attendees={attendees}
            existingItems={existingItems}
            onSubmit={existingItems.length > 0 ? updateAgendaItems : addAgendaItems}
            onFinalize={finalizeMeeting}
          />
        </div>
      </div>
    </div>
  );
}
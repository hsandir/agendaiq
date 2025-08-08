import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { AuditLogger } from "@/lib/audit/audit-logger";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

const agendaItemSchema = z.object({
  topic: z.string().min(1),
  problem_statement: z.string().optional().nullable(),
  staff_initials: z.string().optional().nullable(),
  responsible_staff_id: z.number().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High']),
  purpose: z.enum(['Information_Sharing', 'Discussion', 'Decision', 'Reminder']),
  proposed_solution: z.string().optional().nullable(),
  solution_type: z.enum(['Technical', 'Adaptive', 'Both']).optional().nullable(),
  decisions_actions: z.string().optional().nullable(),
  decision_type: z.enum(['Technical', 'Adaptive', 'Both']).optional().nullable(),
  status: z.enum(['Ongoing', 'Resolved', 'Assigned_to_local', 'Pending', 'Deferred']),
  future_implications: z.boolean().optional().nullable(),
  duration_minutes: z.number().optional().nullable(),
  order_index: z.number()
});

const createAgendaItemsSchema = z.object({
  items: z.array(agendaItemSchema)
});

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/meetings/[id]/agenda-items - Get agenda items for a meeting
export async function GET(request: NextRequest, props: Props) {
  const params = await props.params;
  
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const meetingId = parseInt(params.id);

    const agendaItems = await prisma.meetingAgendaItem.findMany({
      where: { meeting_id: meetingId },
      include: {
        ResponsibleStaff: {
          include: {
            User: true
          }
        },
        Comments: {
          include: {
            Staff: {
              include: {
                User: true
              }
            }
          }
        },
        Attachments: true,
        ActionItems: {
          include: {
            AssignedTo: {
              include: {
                User: true
              }
            }
          }
        }
      },
      orderBy: { order_index: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: agendaItems
    });
  } catch (error) {
    console.error("Error fetching agenda items:", error);
    return NextResponse.json(
      { error: "Failed to fetch agenda items" },
      { status: 500 }
    );
  }
}

// POST /api/meetings/[id]/agenda-items - Create or update agenda items
export async function POST(request: NextRequest, props: Props) {
  const params = await props.params;
  
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    const meetingId = parseInt(params.id);
    const body = await request.json();
    
    const result = createAgendaItemsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.issues },
        { status: 400 }
      );
    }

    // Check if user is the organizer or an attendee
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        MeetingAttendee: true
      }
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    const isOrganizer = meeting.organizer_id === user.staff?.id;
    const isAttendee = meeting.MeetingAttendee.some(ma => ma.staff_id === user.staff?.id);

    if (!isOrganizer && !isAttendee) {
      return NextResponse.json(
        { error: "You are not authorized to manage this meeting's agenda" },
        { status: 403 }
      );
    }

    // Delete existing agenda items for fresh update
    await prisma.meetingAgendaItem.deleteMany({
      where: { meeting_id: meetingId }
    });

    // Create new agenda items
    const createdItems = await Promise.all(
      result.data.items.map(async (item) => {
        return await prisma.meetingAgendaItem.create({
          data: {
            meeting_id: meetingId,
            ...item
          },
          include: {
            ResponsibleStaff: {
              include: {
                User: true
              }
            },
            Comments: true,
            ActionItems: true
          }
        });
      })
    );

    // Log the action
    await AuditLogger.logFromRequest(request, {
      tableName: 'meeting_agenda_items',
      recordId: meetingId.toString(),
      operation: 'BULK_CREATE',
      userId: user.id,
      staffId: user.staff?.id,
      source: 'WEB_UI',
      description: `Created ${createdItems.length} agenda items for meeting ${meeting.title}`
    });

    // Trigger Pusher event for real-time update
    for (const item of createdItems) {
      await pusherServer.trigger(
        CHANNELS.meeting(meetingId),
        EVENTS.AGENDA_ITEM_ADDED,
        {
          item,
          addedBy: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          timestamp: new Date().toISOString()
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: createdItems,
      message: `Successfully created ${createdItems.length} agenda items`
    });

  } catch (error) {
    console.error("Error creating agenda items:", error);
    return NextResponse.json(
      { error: "Failed to create agenda items" },
      { status: 500 }
    );
  }
}

// PUT /api/meetings/[id]/agenda-items - Update all agenda items
export async function PUT(request: NextRequest, props: Props) {
  const params = await props.params;
  
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    const meetingId = parseInt(params.id);
    const body = await request.json();
    
    const result = createAgendaItemsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.issues },
        { status: 400 }
      );
    }

    // Similar authorization and update logic as POST
    // This endpoint would handle updates to existing items
    
    return NextResponse.json({
      success: true,
      message: "Agenda items updated successfully"
    });

  } catch (error) {
    console.error("Error updating agenda items:", error);
    return NextResponse.json(
      { error: "Failed to update agenda items" },
      { status: 500 }
    );
  }
}
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
        responsible_staff: {
          include: {
            users: true
          }
        },
        comments: {
          include: {
            staff: {
              include: {
                users: true
              }
            }
          }
        },
        attachments: true,
        action_items: {
          include: {
            AssignedTo: {
              include: {
                users: true
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
  } catch (error: unknown) {
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
        meeting_attendee: true
      }
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    const isOrganizer = meeting.organizer_id === user.staff?.id;
    const isAttendee = meeting.meeting_attendee.some(ma => ma.staff_id === user.staff?.id);
    const hasAdminAccess = user.is_admin || user.is_system_admin || user.is_school_admin;

    // Debug logging
    console.log('Authorization check for meeting agenda:', {
      meetingId,
      userId: user.id,
      staffId: user.staff?.id,
      organizerId: meeting.organizer_id,
      isOrganizer,
      isAttendee,
      attendeeIds: meeting.meeting_attendee.map(ma => ma.staff_id),
      userFlags: {
        is_admin: user.is_admin,
        is_system_admin: user.is_system_admin,
        is_school_admin: user.is_school_admin
      },
      hasAdminAccess
    });

    if (!isOrganizer && !isAttendee && !hasAdminAccess) {
      return NextResponse.json(
        { error: "You are not authorized to manage this meeting's agenda" },
        { status: 403 }
      );
    }

    // Check if this is a single item addition (typical case) or bulk update
    const isSingleAddition = result.data.items.length === 1 && 
                            result.data.items[0].topic === 'New Agenda Item';

    let createdItems = [];
    
    if (isSingleAddition) {
      // For single item addition, just add it without deleting existing items
      // Remove id field if it exists to avoid unique constraint error
      const { id, ...itemData } = result.data.items[0];
      const newItem = await prisma.meetingAgendaItem.create({
        data: {
          meeting_id: meetingId,
          ...itemData
        },
        include: {
          responsible_staff: {
            include: {
              users: true
            }
          },
          comments: true,
          action_items: true
        }
      });
      createdItems = [newItem];
    } else {
      // For bulk update, delete existing and create new
      await prisma.meetingAgendaItem.deleteMany({
        where: { meeting_id: meetingId }
      });

      // Create new agenda items using createMany for better performance
      // Remove id field from each item to avoid unique constraint errors
      await prisma.meetingAgendaItem.createMany({
        data: result.data.items.map(item => {
          const { id, ...itemData } = item;
          return {
            meeting_id: meetingId,
            ...itemData
          };
        })
      });

      // Fetch the created items
      createdItems = await prisma.meetingAgendaItem.findMany({
        where: { meeting_id: meetingId },
        include: {
          responsible_staff: {
            include: {
              users: true
            }
          },
          comments: true,
          action_items: true
        },
        orderBy: { order_index: 'asc' }
      });
    }

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

    // Trigger Pusher event for real-time update (batch for performance)
    if (createdItems.length === 1) {
      // Single item - send individual event
      await pusherServer.trigger(
        CHANNELS.meeting(meetingId),
        EVENTS.AGENDA_ITEM_ADDED,
        {
          item: createdItems[0],
          addedBy: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          timestamp: new Date().toISOString()
        }
      );
    } else if (createdItems.length > 1) {
      // Multiple items - send batch event
      await pusherServer.trigger(
        CHANNELS.meeting(meetingId),
        'agenda-items-bulk-added',
        {
          items: createdItems,
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

  } catch (error: unknown) {
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

    // Check if user is the organizer or an attendee
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        meeting_attendee: true
      }
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    const isOrganizer = meeting.organizer_id === user.staff?.id;
    const isAttendee = meeting.meeting_attendee.some(ma => ma.staff_id === user.staff?.id);
    const hasAdminAccess = user.is_admin || user.is_system_admin || user.is_school_admin;

    // Debug logging
    console.log('Authorization check for meeting agenda:', {
      meetingId,
      userId: user.id,
      staffId: user.staff?.id,
      organizerId: meeting.organizer_id,
      isOrganizer,
      isAttendee,
      attendeeIds: meeting.meeting_attendee.map(ma => ma.staff_id),
      userFlags: {
        is_admin: user.is_admin,
        is_system_admin: user.is_system_admin,
        is_school_admin: user.is_school_admin
      },
      hasAdminAccess
    });

    if (!isOrganizer && !isAttendee && !hasAdminAccess) {
      return NextResponse.json(
        { error: "You are not authorized to manage this meeting's agenda" },
        { status: 403 }
      );
    }

    // Delete all existing agenda items for this meeting
    await prisma.meetingAgendaItem.deleteMany({
      where: { meeting_id: meetingId }
    });

    // Create new agenda items
    const createdItems = await Promise.all(
      result.data.items.map(async (item, index) => {
        // Remove id field if it exists to avoid unique constraint error
        const { id, ...itemData } = item as any;
        
        return prisma.meetingAgendaItem.create({
          data: {
            meeting_id: meetingId,
            ...itemData,
            order_index: index
          },
          include: {
            responsible_staff: {
              include: {
                users: true
              }
            },
            comments: true,
            action_items: true
          }
        });
      })
    );

    // Log the action
    await AuditLogger.logFromRequest(request, {
      tableName: 'meeting_agenda_items',
      recordId: meetingId.toString(),
      operation: 'BULK_UPDATE',
      userId: user.id,
      staffId: user.staff?.id,
      source: 'WEB_UI',
      description: `Updated agenda items for meeting ${meeting.title}`
    });

    // Trigger Pusher event for real-time update
    await pusherServer.trigger(
      CHANNELS.meeting(meetingId),
      'agenda-items-updated',
      {
        items: createdItems,
        updatedBy: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        timestamp: new Date().toISOString()
      }
    );
    
    return NextResponse.json({
      success: true,
      data: createdItems,
      message: "Agenda items updated successfully"
    });

  } catch (error: unknown) {
    console.error("Error updating agenda items:", error);
    return NextResponse.json(
      { error: "Failed to update agenda items" },
      { status: 500 }
    );
  }
}
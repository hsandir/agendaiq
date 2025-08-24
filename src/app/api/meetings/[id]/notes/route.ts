import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { AuditLogger } from "@/lib/audit/audit-logger";
import { z } from "zod";

const createNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/meetings/[id]/notes - Get notes for a meeting
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
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    // Check if user has access to this meeting
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        meeting_attendee: {
          where: {
            staff_id: authResult.user?.staff?.id || -1
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const isOrganizer = meeting.organizer_id === authResult.user?.staff?.id;
    const isAttendee = meeting.meeting_attendee.length > 0;

    if (!isOrganizer && !isAttendee) {
      return NextResponse.json(
        { error: "You don't have access to this meeting" },
        { status: 403 }
      );
    }

    // Fetch all notes for the meeting
    const notes = await prisma.meeting_notes.findMany({
      where: { meeting_id: meetingId },
      include: {
        staff: {
          include: {
            users: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      notes: notes.map(note => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        author: {
          name: note.staff.users.name,
          email: note.staff.users.email
        }
      }))
    });
  } catch (error: unknown) {
    console.error("Error fetching meeting notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST /api/meetings/[id]/notes - Add a note to a meeting
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
    if (!user.staff) {
      return NextResponse.json(
        { error: "Staff record required to add notes" },
        { status: 403 }
      );
    }

    const meetingId = parseInt(params.id);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;
    const result = createNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    // Check if user has access to this meeting
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        meeting_attendee: {
          where: {
            staff_id: user.staff.id
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const isOrganizer = meeting.organizer_id === user.staff.id;
    const isAttendee = meeting.meeting_attendee.length > 0;

    if (!isOrganizer && !isAttendee) {
      return NextResponse.json(
        { error: "You don't have access to this meeting" },
        { status: 403 }
      );
    }

    // Create the note
    const note = await prisma.meeting_notes.create({
      data: {
        meeting_id: meetingId,
        staff_id: user.staff.id,
        content: result.data.content
      },
      include: {
        staff: {
          include: {
            users: true
          }
        }
      }
    });

    // Log the action
    await AuditLogger.logFromRequest(request, {
      tableName: 'meeting_notes',
      recordId: note.id.toString(),
      operation: 'CREATE',
      userId: user.id,
      staffId: user.staff.id,
      source: 'WEB_UI',
      description: `Added note to meeting: ${meeting.title}`
    });

    return NextResponse.json({
      success: true,
      note: {
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        author: {
          name: note.staff.users.name,
          email: note.staff.users.email
        }
      }
    });
  } catch (error: unknown) {
    console.error("Error creating meeting note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

// DELETE /api/meetings/[id]/notes/[noteId] - Delete a note
export async function DELETE(request: NextRequest, props: Props) {
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
    if (!user.staff) {
      return NextResponse.json(
        { error: "Staff record required" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const noteId = parseInt(url.searchParams.get('noteId') || '');
    
    if (isNaN(noteId)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    // Check if note exists and belongs to the user
    const note = await prisma.meeting_notes.findUnique({
      where: { id: noteId },
      include: {
        meeting: true
      }
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the author or meeting organizer can delete the note
    const isAuthor = note.staff_id === user.staff.id;
    const isOrganizer = note.meeting.organizer_id === user.staff.id;

    if (!isAuthor && !isOrganizer) {
      return NextResponse.json(
        { error: "You can only delete your own notes" },
        { status: 403 }
      );
    }

    // Delete the note
    await prisma.meeting_notes.delete({
      where: { id: noteId }
    });

    // Log the action
    await AuditLogger.logFromRequest(request, {
      tableName: 'meeting_notes',
      recordId: noteId.toString(),
      operation: 'DELETE',
      userId: user.id,
      staffId: user.staff.id,
      source: 'WEB_UI',
      description: `Deleted note from meeting: ${note.meeting.title}`
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully"
    });
  } catch (error: unknown) {
    console.error("Error deleting meeting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
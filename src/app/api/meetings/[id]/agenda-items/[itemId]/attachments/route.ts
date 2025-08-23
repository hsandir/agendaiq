import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { isAnyAdmin } from '@/lib/auth/policy';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const params = await props.params;
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    const meetingId = parseInt(params.id);
    const itemId = parseInt(params.itemId);

    if (isNaN(meetingId) || isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid meeting or item ID' },
        { status: 400 }
      );
    }

    // Check if user has access
    const agendaItem = await prisma.meetingAgendaItem.findUnique({
      where: { id: itemId },
      include: {
        meeting: {
          include: {
            meeting_attendee: {
              where: { staff_id: user.staff?.id || -1 }
            }
          }
        }
      }
    });

    if (!agendaItem || agendaItem.meeting_id !== meetingId) {
      return NextResponse.json(
        { error: 'Agenda item not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isOrganizer = agendaItem.meeting.organizer_id === user.staff?.id;
    const isAttendee = agendaItem.meeting.meeting_attendee.length > 0;
    const hasAdminAccess = isAnyAdmin(user);

    if (!isOrganizer && !isAttendee && !hasAdminAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(process.cwd(), 'public', 'uploads', 'agenda-items', fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const attachment = await prisma.agendaItemAttachment.create({
      data: {
        agenda_item_id: itemId,
        file_name: file.name,
        file_url: `/uploads/agenda-items/${fileName}`,
        file_size: file.size,
        content_type: file.type,
        uploaded_by_id: user.staff!.id
      }
    });

    return NextResponse.json({
      success: true,
      data: attachment
    });

  } catch (error: unknown) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const params = await props.params;
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const attachments = await prisma.agendaItemAttachment.findMany({
      where: { agenda_item_id: itemId },
      include: {
        UploadedBy: {
          include: {
            users: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: attachments
    });

  } catch (error: unknown) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
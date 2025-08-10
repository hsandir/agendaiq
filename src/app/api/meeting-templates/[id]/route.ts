import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;

  try {
    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const template = await prisma.meetingTemplate.findUnique({
      where: { id: templateId },
      include: {
        Staff: {
          include: {
            User: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Meeting template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        duration: template.duration,
        agenda: template.agenda,
        attendees: template.attendees,
        is_active: template.is_active,
        created_by: template.created_by,
        created_at: template.created_at,
        updated_at: template.updated_at,
        creator: template.Staff.User.name || template.Staff.User.email
      }
    });

  } catch (error) {
    console.error('Error fetching meeting template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.MEETING_CREATE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;

  try {
    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, duration, agenda, attendees, is_active } = body;

    const template = await prisma.meetingTemplate.update({
      where: { id: templateId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        duration: duration ? parseInt(duration) : undefined,
        agenda: agenda !== undefined ? agenda : undefined,
        attendees: attendees || undefined,
        is_active: is_active !== undefined ? is_active : undefined
      },
      include: {
        Staff: {
          include: {
            User: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        duration: template.duration,
        agenda: template.agenda,
        attendees: template.attendees,
        is_active: template.is_active,
        created_by: template.created_by,
        created_at: template.created_at,
        updated_at: template.updated_at,
        creator: template.Staff.User.name || template.Staff.User.email
      }
    });

  } catch (error) {
    console.error('Error updating meeting template:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.MEETING_CREATE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;

  try {
    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Check if template is being used by any meetings
    const meetingsUsingTemplate = await prisma.meeting.count({
      where: { template_id: templateId }
    });

    if (meetingsUsingTemplate > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is being used by meetings' },
        { status: 400 }
      );
    }

    await prisma.meetingTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({
      success: true,
      message: 'Meeting template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meeting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting template' },
      { status: 500 }
    );
  }
} 
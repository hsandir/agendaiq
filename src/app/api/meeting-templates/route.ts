import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireStaff: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;

  try {
    const templates = await prisma.meetingTemplate.findMany({
      where: {
        is_active: true
      },
      include: {
        Staff: {
          include: {
            User: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      templates: templates.map(template => ({
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
      })),
      count: templates.length
    });

  } catch (error) {
    console.error('Error fetching meeting templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireAdminRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;

  try {
    const body = await request.json();
    const { name, description, duration, agenda, attendees } = body;

    if (!name || !duration) {
      return NextResponse.json(
        { error: 'Name and duration are required' },
        { status: 400 }
      );
    }

    // Get the staff record for the current user
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const template = await prisma.meetingTemplate.create({
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        agenda: agenda || null,
        attendees: attendees || [],
        created_by: staff.id
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
    console.error('Error creating meeting template:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting template' },
      { status: 500 }
    );
  }
} 
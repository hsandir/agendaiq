import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const templates = await prisma.meetingTemplate.findMany({
      where: {
        is_active: true
      },
      include: {
        staff: {
          include: {
            users: true
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
        creator: template.staff.users.name ?? template.staff.users.email
      })),
      count: templates.length
    });

  } catch (error: unknown) {
    console.error('Error fetching meeting templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.MEETING_CREATE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;

  try {
    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;
    const { _name, _description, _duration, _agenda, _attendees  } = body;

    if (!name || !duration) {
      return NextResponse.json(
        { error: 'Name and duration are required' },
        { status: 400 }
      );
    }

    // Get the staff record for the current user
    const staff = await prisma.staff.findFirst({
      where: { user_id: parseInt(user.id) }
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
        description: description ?? null,
        duration: parseInt(duration),
        agenda: agenda ?? null,
        attendees: attendees ?? [],
        created_by: staff.id
      },
      include: {
        staff: {
          include: {
            users: true
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
        creator: template.staff.users.name ?? template.staff.users.email
      }
    });

  } catch (error: unknown) {
    console.error('Error creating meeting template:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting template' },
      { status: 500 }
    );
  }
} 
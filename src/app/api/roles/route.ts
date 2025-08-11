import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from "@/lib/prisma";

// GET /api/roles - List all roles
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const roles = await prisma.role.findMany({
      orderBy: { priority: 'asc' }
    });
    
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const body = await request.json();
    const { title, priority, is_leadership, category, description } = body;

    if (!title || priority === undefined) {
      return NextResponse.json(
        { error: 'Title and priority are required' },
        { status: 400 }
      );
    }

    // Check if role with same title exists
    const existingRole = await prisma.role.findFirst({
      where: { title }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this title already exists' },
        { status: 409 }
      );
    }

    const role = await prisma.role.create({
      data: {
        title,
        priority,
        is_leadership: is_leadership || false,
        category,
        // TODO: Add description field to Role model in schema
        // description
      }
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/roles - Update a role
export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const body = await request.json();
    const { id, title, priority, is_leadership, category, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // If title is being changed, check for conflicts
    if (title && title !== existingRole.title) {
      const titleConflict = await prisma.role.findFirst({
        where: { title }
      });

      if (titleConflict) {
        return NextResponse.json(
          { error: 'Role with this title already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (priority !== undefined) updateData.priority = priority;
    if (is_leadership !== undefined) updateData.is_leadership = is_leadership;
    if (category !== undefined) updateData.category = category;
    // TODO: Add description field to Role model in schema
    // if (description !== undefined) updateData.description = description;

    const role = await prisma.role.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '../../../lib/auth/api-auth';
import { Capability } from '../../../lib/auth/policy';
import { prisma } from "../../../lib/prisma";

// Role update data interface
interface RoleUpdateData {
  key?: string | null;
  priority?: number;
  is_leadership?: boolean;
  category?: string;
}

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
  } catch (error: unknown) {
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
    const body = await request.json() as Record<string, unknown>;
    const { _key, _priority, _is_leadership, _category, _description } = body;

    if (!key || priority === undefined) {
      return NextResponse.json(
        { error: 'Role key and priority are required' },
        { status: 400 }
      );
    }

    // Check if role with same key exists
    const existingRole = await prisma.role.findFirst({
      where: { key: key as string }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this key already exists' },
        { status: 409 }
      );
    }

    const role = await prisma.role.create({
      data: {
        key: key as string,
        priority: priority as number,
        is_leadership: (is_leadership as boolean) ?? false,
        category: category as string,
        // TODO: Add description field to Role model in schema
        // description
      }
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error: unknown) {
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
    const body = await request.json() as Record<string, unknown>;
    const { _id, _key, _priority, _is_leadership, _category, _description } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: id as number }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // If key is being changed, check for conflicts
    if (key && key !== existingRole.key) {
      const keyConflict = await prisma.role.findFirst({
        where: { key: key as string }
      });

      if (keyConflict) {
        return NextResponse.json(
          { error: 'Role with this key already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: RoleUpdateData = {};
    if (key !== undefined) updateData.key = key as string;
    if (priority !== undefined) updateData.priority = priority as number;
    if (is_leadership !== undefined) updateData.is_leadership = is_leadership as boolean;
    if (category !== undefined) updateData.category = category as string;
    // TODO: Add description field to Role model in schema
    // if (description !== undefined) updateData.description = description;

    const role = await prisma.role.update({
      where: { id: id as number },
      data: updateData
    });

    return NextResponse.json(role);
  } catch (error: unknown) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
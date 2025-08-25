import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '../../../../lib/auth/api-auth';
import { Capability } from '../../../../lib/auth/policy';
import { prisma } from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireCapability: Capability?.USER_MANAGE });
  if (!authResult?.success) {
    return NextResponse.json({ error: authResult?.error }, { status: authResult?.statusCode });
  }
  try {
    // Get all roles from the database
    const roles = await prisma.role.findMany({
      include: {
        department: true,
        staff: {
          include: {
            users: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    return NextResponse.json(roles);
  } catch (error: unknown) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireCapability: Capability?.USER_MANAGE });
  if (!authResult?.success) {
    return NextResponse.json({ error: authResult?.error }, { status: authResult?.statusCode });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const { title, priority, category, department_id } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Role title is required" },
        { status: 400 }
      );
    }

    // Create the new role
    const newRole = await prisma.role.create({
      data: {
        title: title as string,
        priority: (priority as number) ?? 10,
        category: category as string,
        department_id: department_id as number
      },
      include: {
        department: true
      }
    });

    return NextResponse.json(newRole);
  } catch (error: unknown) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
} 
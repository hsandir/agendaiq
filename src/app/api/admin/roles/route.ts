import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireAdminRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    // Get all roles from the database
    const roles = await prisma.role.findMany({
      include: {
        Department: true,
        Staff: {
          include: {
            User: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
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
        title,
        priority: priority || 10,
        category,
        department_id
      },
      include: {
        Department: true
      }
    });

    return NextResponse.json(newRole);
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
} 
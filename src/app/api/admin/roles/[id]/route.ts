import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from "@/lib/auth/policy";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const body = await request.json();
    const { title, priority, category, department_id } = body as { title?: string; priority?: number; category?: string; department_id?: number | string };

    if (!title) {
      return NextResponse.json(
        { error: "Role title is required" },
        { status: 400 }
      );
    }

    // Update the role
    const updatedRole = await prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        title,
        priority: typeof priority === 'number' ? priority : undefined,
        category: category ?? undefined,
        department_id: typeof department_id === 'string' ? parseInt(department_id) : (typeof department_id === 'number' ? department_id : undefined),
      },
      include: {
        department: true,
        staff: {
          include: {
            users: true
          }
        }
      }
    });

    return NextResponse.json(updatedRole);
  } catch (error: unknown) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Delete the role
    await prisma.role.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
} 
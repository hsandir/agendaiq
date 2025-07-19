import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Helper function to verify admin access
async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      Staff: {
        include: {
          Role: true
        }
      }
    }
  });

  if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== 'Administrator') {
    return null;
  }

  return user;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, priority, category, department_id } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Role title is required" },
        { status: 400 }
      );
    }

    // Update the role
    const updatedRole = await prisma.role.update({
      where: { id: parseInt(params.id) },
      data: {
        title,
        priority: priority || undefined,
        category: category || undefined,
        department_id: department_id || undefined,
      },
      include: {
        Department: true,
        Staff: {
          include: {
            User: true
          }
        }
      }
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 }
    );
  }

  try {
    // Delete the role
    await prisma.role.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
} 
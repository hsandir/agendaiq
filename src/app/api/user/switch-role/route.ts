import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'user'" },
        { status: 400 }
      );
    }

    // Find the user and their staff record
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        staff: {
          include: {
            role: true,
            department: true,
            school: true,
            district: true
          }
        }
      }
    });

    if (!user || !user.staff || user.staff.length === 0) {
      return NextResponse.json(
        { error: "User staff record not found" },
        { status: 404 }
      );
    }

    const staffRecord = user.staff[0];
    let targetRole;

    if (role === 'admin') {
      // Find Administrator role
      targetRole = await prisma.role.findFirst({
        where: { 
          title: 'Administrator'
        }
      });
    } else {
      // Find a regular staff role (prefer Teacher roles)
      targetRole = await prisma.role.findFirst({
        where: { 
          OR: [
            { title: { contains: 'Teacher' } },
            { title: 'School Counselor' },
            { title: 'School Nurse' },
            { title: 'Administrative Assistant' }
          ]
        }
      });
    }

    if (!targetRole) {
      return NextResponse.json(
        { error: `No suitable ${role} role found` },
        { status: 404 }
      );
    }

    // Update the staff record with the new role
    await prisma.staff.update({
      where: { id: staffRecord.id },
      data: { 
        role_id: targetRole.id,
        department_id: targetRole.department_id
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Role switched to ${targetRole.title}`,
      newRole: {
        id: targetRole.id,
        title: targetRole.title
      }
    });
  } catch (error) {
    console.error("Error switching role:", error);
    return NextResponse.json(
      { error: "Failed to switch role", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 
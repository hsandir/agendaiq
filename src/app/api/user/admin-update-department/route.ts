import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAdminRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    const body = await request.json();
    const { userId, departmentId } = body;

    if (!userId || !departmentId) {
      return NextResponse.json(
        { error: "User ID and department ID are required" },
        { status: 400 }
      );
    }

    // Find the user's staff record
    const userStaff = await prisma.staff.findFirst({
      where: { user_id: userId },
    });

    if (!userStaff) {
      return NextResponse.json(
        { error: "User staff record not found" },
        { status: 404 }
      );
    }

    // Update the staff record's department
    await prisma.staff.update({
      where: { id: userStaff.id },
      data: { department_id: departmentId },
    });

    // Get updated user with staff
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { Staff: { include: { Role: true, Department: true } } },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user department:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: user.id },
      include: { staff: { include: { role: true } } },
    });

    if (!admin || admin.staff?.[0]?.role?.title !== "Administrator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      include: { staff: { include: { role: true, department: true } } },
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
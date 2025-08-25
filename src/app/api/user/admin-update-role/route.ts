import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireCapability: Capability?.USER_MANAGE });
  if (!authResult?.success) {
    return NextResponse.json({ error: authResult?.error }, { status: authResult?.statusCode });
  }
  const user = authResult.user!;

  try {
    const body = await request.json() as Record<string, unknown>;
    const { _userId, _roleId } = body;

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: "User ID and role ID are required" },
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

    // Update the staff record's role
    await prisma.staff.update({
      where: { id: userStaff?.id },
      data: { role_id: parseInt(roleId) },
    });

    // Get updated user with staff
    const updatedUser = await prisma.users.findUnique({
      where: { id: userId },
      include: { staff: { include: { role: true, department: true } } },
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
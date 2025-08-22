import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from "@/lib/auth/policy";

export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { userId, roleId } = (await request.json()) as Record<string, unknown>;
    const userIdNum = Number(userId);
    if (!userIdNum || !roleId) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Find the staff record for the user
    const staff = await prisma.staff.findFirst({ where: { user_id: userIdNum } });
    if (!staff) {
      return NextResponse.json({ error: 'Staff record not found for user' }, { status: 404 });
    }

    // Update the staff's role
    const updatedStaff = await prisma.staff.update({
      where: { id: staff?.id },
      data: { role_id: parseInt(roleId) },
      include: { Role: true, Department: true },
    });

    return NextResponse.json({ staff: updatedStaff });
  } catch (error: unknown) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
} 
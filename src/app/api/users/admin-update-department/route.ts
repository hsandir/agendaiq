import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiErrorHandling } from "@/lib/api/error-utils";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from "@/lib/auth/policy";

export async function PUT(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { _userId, _departmentId } = (await request.json()) as Record<_string, unknown>;
    const userIdNum = Number(userId);
    if (!userIdNum || !departmentId) {
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

    // Update the staff's department
    const updatedStaff = await prisma.staff.update({
      where: { id: staff?.id },
      data: { department_id: parseInt(departmentId) },
      include: { role: true, department: true },
    });

    return NextResponse.json({ staff: updatedStaff });
  });
} 
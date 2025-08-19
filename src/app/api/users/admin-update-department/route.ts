import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { withApiErrorHandling } from "@/lib/api/error-utils";

export async function PUT(request: Request) {
  return withApiErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the current user is an administrator via staff relation
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { Role: true } } },
    });
    const isAdmin = currentUser?.Staff?.[0]?.Role?.title === 'Administrator';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { userId, departmentId } = (await request.json()) as Record<__string, unknown>;
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
      include: { Role: true, Department: true },
    });

    return NextResponse.json({ staff: updatedStaff });
  });
} 
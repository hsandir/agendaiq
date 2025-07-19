import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an administrator via staff relation
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Staff: { include: { Role: true } } },
    });
    const isAdmin = currentUser?.Staff?.[0]?.Role?.title === 'Administrator';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await context.params;
    const { roleId, departmentId } = await request.json();
    const userIdNum = Number(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    // Find the staff record for the user
    const staff = await prisma.staff.findFirst({ where: { user_id: userIdNum } });
    if (!staff) {
      return NextResponse.json({ error: 'Staff record not found for user' }, { status: 404 });
    }

    // Prepare update data
    const updateData: { role_id: number; department_id?: number } = { role_id: roleId };
    if (departmentId !== undefined && departmentId !== null) {
      updateData.department_id = departmentId;
    }

    // Update the staff's role and department
    const updatedStaff = await prisma.staff.update({
      where: { id: staff.id },
      data: updateData,
      include: { Role: true, Department: true },
    });

    return NextResponse.json({ staff: updatedStaff });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  return PUT(request, context);
} 
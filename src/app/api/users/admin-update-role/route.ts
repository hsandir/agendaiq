import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the current user is an administrator via staff relation
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { Staff: { include: { Role: true } } },
    });
    const isAdmin = currentUser?.Staff?.[0]?.Role?.title === 'Administrator';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { userId, roleId } = await request.json();
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
      where: { id: staff.id },
      data: { role_id: roleId },
      include: { Role: true, Department: true },
    });

    return NextResponse.json({ staff: updatedStaff });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if the current user is an administrator via staff relation
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { staff: { include: { role: true } } },
  });
  const isAdmin = currentUser?.staff?.[0]?.role?.title === 'Administrator';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { departmentId } = await req.json();
  const { userId: userIdStr } = await params;
  const userId = Number(userIdStr);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  // Find the staff record for the user
  const staff = await prisma.staff.findFirst({
    where: { user_id: userId },
  });
  if (!staff) {
    return NextResponse.json({ error: 'Staff record not found for user' }, { status: 404 });
  }

  // Update the staff's department
  const updatedStaff = await prisma.staff.update({
    where: { id: staff.id },
    data: { department_id: departmentId },
    include: { role: true, department: true },
  });

  return NextResponse.json({ staff: updatedStaff });
} 
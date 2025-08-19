import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { Role: true } } },
    });

    if (!currentUser || (currentUser.Staff?.[0]?.Role?.title !== 'Administrator')) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, roleId } = body;

    if (!email || !roleId) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { Staff: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update or create staff record
    if (user.Staff?.[0]) {
      await prisma.staff.update({
        where: { id: user.Staff[0].id },
        data: { role_id: parseInt(roleId) },
      });
    } else {
      // Need school_id and district_id for new staff record
      return NextResponse.json(
        { error: "Cannot create staff record without school and district" },
        { status: 400 }
      );
    }

    // Get updated user with staff
    const updatedUser = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { Staff: { include: { Role: true, Department: true } } },
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error("Role toggle error:", error);
    return NextResponse.json(
      { error: "Error updating role" },
      { status: 500 }
    );
  }
} 
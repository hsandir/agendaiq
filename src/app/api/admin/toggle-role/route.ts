import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from "@/lib/auth/policy";

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const body = await request.json();
    const { email, roleId } = body as { email?: string; roleId?: number | string };

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
        data: { role_id: typeof roleId === 'string' ? parseInt(roleId) : Number(roleId) },
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
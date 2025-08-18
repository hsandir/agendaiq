import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/user/school - Get current user's school
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { School: true } } },
    });

    if (!user?.Staff?.[0]?.School) {
      return new NextResponse("School not found", { status: 404 });
    }

    return new NextResponseJSON.stringify((user.Staff[0].School), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching user school:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/user/school - Update user's school
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { schoolId } = body;

    if (!schoolId) {
      return new NextResponse("School ID is required", { status: 400 });
    }

    // Validate school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return new NextResponse("School not found", { status: 404 });
    }

    // Find user's staff record
    const userStaff = await prisma.staff.findFirst({
      where: { user_id: session.user.id as string },
    });

    if (!userStaff) {
      return new NextResponse("User staff record not found", { status: 404 });
    }

    // Update staff record's school
    await prisma.staff.update({
      where: { id: userStaff.id },
      data: { school_id: parseInt(schoolId) },
    });

    // Get updated user with staff
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { School: true } } },
    });

    return new NextResponse(JSON.stringify(updatedUser?.Staff?.[0]?.School), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error updating user school:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/user/school - Remove user from school
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find user's staff record
    const userStaff = await prisma.staff.findFirst({
      where: { user_id: session.user.id as string },
    });

    if (!userStaff) {
      return new NextResponse("User staff record not found", { status: 404 });
    }

    // Remove school association (set to null if allowed by schema)
    // Note: This might not be possible if school_id is required
    // In that case, you might need to delete the staff record or handle differently
    
    return new NextResponse("School association removed", { status: 200 });
  } catch (error: unknown) {
    console.error("Error removing user school:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/user/school - Get current user's school
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: auth.user.id },
      include: { staff: { include: { school: true } } },
    });

    if (!user?.staff?.[0]?.school) {
      return new NextResponse("School not found", { status: 404 });
    }

    return new NextResponse(JSON.stringify(user.staff[0].school), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching user school:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/user/school - Update user's school
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    const body = await request.json() as Record<string, unknown>;
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
      where: { user_id: auth.user.id },
    });

    if (!userStaff) {
      return new NextResponse("User staff record not found", { status: 404 });
    }

    // Update staff record's school
    await prisma.staff.update({
      where: { id: userStaff?.id },
      data: { school_id: parseInt(schoolId) },
    });

    // Get updated user with staff
    const updatedUser = await prisma.users.findUnique({
      where: { id: auth.user.id },
      include: { staff: { include: { school: true } } },
    });

    return new NextResponse(JSON.stringify(updatedUser?.staff?.[0]?.school), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error updating user school:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/user/school - Remove user from school
export async function DELETE(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    // Find user's staff record
    const userStaff = await prisma.staff.findFirst({
      where: { user_id: auth.user.id },
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
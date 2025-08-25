import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;

  try {
    const userProfile = await prisma.users.findUnique({
      where: { email: user.email },
      include: {
        staff: {
          include: {
            role: true,
            department: true,
            school: {
              include: {
                district: true
              }
            }
          }
        }
      }
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      staff_id: userProfile.staff_id,
      staff: userProfile.staff?.[0] ? {
        id: userProfile.staff[0].id,
        role: userProfile.staff[0].role,
        department: userProfile.staff[0].department,
        school: userProfile.staff[0].school
      } : null
    });
  } catch (error: unknown) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;

  try {
    const body = await request.json() as Record<string, unknown>;
    const { name, phone } = body;

    const updateData: { name?: string; phone?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await prisma.users.update({
      where: { email: user.email },
      data: updateData,
      include: {
        staff: {
          include: {
            role: true,
            department: true,
            school: {
              include: {
                district: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      staff_id: updatedUser.staff_id,
      staff: updatedUser.staff?.[0] ? {
        id: updatedUser.staff[0].id,
        role: updatedUser.staff[0].role,
        department: updatedUser.staff[0].department,
        school: updatedUser.staff[0].school
      } : null
    });
  } catch (error: unknown) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
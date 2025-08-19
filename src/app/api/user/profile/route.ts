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
    const userProfile = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: {
              include: {
                District: true
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
      staff: userProfile.Staff?.[0] ? {
        id: userProfile.Staff[0].id,
        role: userProfile.Staff[0].Role,
        department: userProfile.Staff[0].Department,
        school: userProfile.Staff[0].School
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
    const body = (await request.json()) as Record<string, unknown>;
    const { name, phone } = body;

    const updateData: { name?: string; phone?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await prisma.user.update({
      where: { email: user.email },
      data: updateData,
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: {
              include: {
                District: true
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
      staff: updatedUser.Staff?.[0] ? {
        id: updatedUser.Staff[0].id,
        role: updatedUser.Staff[0].Role,
        department: updatedUser.Staff[0].Department,
        school: updatedUser.Staff[0].School
      } : null
    });
  } catch (error: unknown) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
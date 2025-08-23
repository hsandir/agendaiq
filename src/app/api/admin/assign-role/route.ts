import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssignRoleRequest } from "@/types";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from "@/lib/auth/policy";

async function findManagerId(roleTitle: string, departmentId: number) {
  switch (roleTitle) {
    case 'Teacher':
      // Find Department Chair of the same department
      const departmentChair = await prisma.staff.findFirst({
        where: {
          Role: { title: 'Department Chair' },
          department_id: parseInt(departmentId),
        },
        include: { User: true },
      });
      return departmentChair?.user_id;

    case 'Department Chair':
      // Find STEM Chair
      const stemChair = await prisma.staff.findFirst({
        where: {
          Role: { title: 'STEM Chair' },
        },
        include: { User: true },
      });
      return stemChair?.user_id;

    case 'STEM Chair':
      // Find Admin
      const admin = await prisma.staff.findFirst({
        where: {
          Role: { title: 'Administrator' },
        },
        include: { User: true },
      });
      return admin?.user_id;

    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const body = (await request.json()) as AssignRoleRequest & { email?: string; roleId?: number | string; departmentId?: number | string; managerId?: number | string };
    const { email, roleId, departmentId, managerId } = body;

    if (!email || !roleId || !departmentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Get role title for manager assignment
    const role = await prisma.role.findUnique({
      where: { id: typeof roleId === 'string' ? parseInt(roleId) : Number(roleId) },
    });

    // Find or determine manager ID
    const deptIdNum = typeof departmentId === 'string' ? parseInt(departmentId) : Number(departmentId);
    const autoAssignedManagerId = role ? await findManagerId(role?.title, deptIdNum) : null;
    const finalManagerId = managerId ? (typeof managerId === 'string' ? parseInt(managerId) : Number(managerId)) : autoAssignedManagerId ?? undefined;

    // Update or create staff record
    if (user.Staff?.[0]) {
      await prisma.staff.update({
        where: { id: user.Staff[0].id },
        data: {
          role_id: typeof roleId === 'string' ? parseInt(roleId) : Number(roleId),
          department_id: deptIdNum,
          manager_id: typeof finalManagerId === 'number' ? finalManagerId : undefined,
        },
      });
    } else {
      // Get default school and district for new staff record
      const defaultSchool = await prisma.school.findFirst();
      const defaultDistrict = await prisma.district.findFirst();

      if (!defaultSchool || !defaultDistrict) {
        return NextResponse.json(
          { error: "Default school or district not found" },
          { status: 500 }
        );
      }

      await prisma.staff.create({
        data: {
          user_id: typeof user?.id === 'string' ? parseInt(user?.id) : Number(user?.id),
          role_id: typeof roleId === 'string' ? parseInt(roleId) : Number(roleId),
          department_id: deptIdNum,
          school_id: typeof defaultSchool?.id === 'string' ? parseInt(defaultSchool?.id) : Number(defaultSchool?.id),
          district_id: typeof defaultDistrict?.id === 'string' ? parseInt(defaultDistrict?.id) : Number(defaultDistrict?.id),
          manager_id: typeof finalManagerId === 'number' ? finalManagerId : undefined,
        },
      });
    }

    // Get updated user with staff
    const updatedUser = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { Staff: { include: { Role: true, Department: true } } },
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error("Role assignment error:", error);
    return NextResponse.json(
      { error: "Error assigning role" },
      { status: 500 }
    );
  }
} 
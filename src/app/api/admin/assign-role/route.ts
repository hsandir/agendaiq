import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

async function findManagerId(roleTitle: string, departmentId: number) {
  switch (roleTitle) {
    case 'Teacher':
      // Find Department Chair of the same department
      const departmentChair = await prisma.staff.findFirst({
        where: {
          Role: { title: 'Department Chair' },
          department_id: departmentId,
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

export async function POST(request: Request) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { Staff: { include: { Role: true } } },
    });

    if (!currentUser || currentUser.Staff?.[0]?.Role?.title !== 'Administrator') {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
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
      where: { id: roleId },
    });

    // Find or determine manager ID
    const autoAssignedManagerId = role ? await findManagerId(role.title, departmentId) : null;
    const finalManagerId = managerId || autoAssignedManagerId;

    // Update or create staff record
    if (user.Staff?.[0]) {
      await prisma.staff.update({
        where: { id: user.Staff[0].id },
        data: {
          role_id: roleId,
          department_id: departmentId,
          manager_id: finalManagerId,
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
          user_id: user.id,
          role_id: roleId,
          department_id: departmentId,
          school_id: defaultSchool.id,
          district_id: defaultDistrict.id,
          manager_id: finalManagerId,
        },
      });
    }

    // Get updated user with staff
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Staff: { include: { Role: true, Department: true } } },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Role assignment error:", error);
    return NextResponse.json(
      { error: "Error assigning role" },
      { status: 500 }
    );
  }
} 
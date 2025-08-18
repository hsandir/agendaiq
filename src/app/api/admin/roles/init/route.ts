import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { Role: true } } },
    });

    if (!user || ((user as Record<string, unknown>).Staff?.[0]?.Role?.title !== 'Administrator')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Initialize default roles
    const defaultDepartment = await prisma.department.findFirst();
    
    if (!defaultDepartment) {
      return NextResponse.json(
        { error: "No department found. Create departments first." },
        { status: 400 }
      );
    }

    const roles = [
      { title: 'Administrator', priority: 1, department_id: parseInt(defaultDepartment.id) },
      { title: 'STEM Chair', priority: 2, department_id: parseInt(defaultDepartment.id) },
      { title: 'Department Chair', priority: 3, department_id: parseInt(defaultDepartment.id) },
      { title: 'Teacher', priority: 4, department_id: parseInt(defaultDepartment.id) },
    ];

    const createdRoles = [];
    for (const roleData of roles) {
      const existingRole = await prisma.role.findFirst({
        where: { title: roleData.title },
      });

      if (!existingRole) {
        const role = await prisma.role.create({
          data: roleData,
        });
        createdRoles.push(role);
      } else {
        createdRoles.push(existingRole);
      }
    }

    return NextResponse.json({ roles: createdRoles });
  } catch (error: unknown) {
    console.error("Error initializing roles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
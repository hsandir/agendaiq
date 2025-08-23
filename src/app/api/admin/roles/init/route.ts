import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
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
      { title: 'Administrator', priority: 1, department_id: parseInt(defaultDepartment?.id) },
      { title: 'STEM Chair', priority: 2, department_id: parseInt(defaultDepartment?.id) },
      { title: 'Department Chair', priority: 3, department_id: parseInt(defaultDepartment?.id) },
      { title: 'Teacher', priority: 4, department_id: parseInt(defaultDepartment?.id) },
    ];

    const createdRoles = [];
    for (const roleData of roles) {
      const existingRole = await prisma.role.findFirst({
        where: { title: roleData?.title },
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
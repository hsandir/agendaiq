import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from '@/lib/auth/policy';
import { prisma } from "@/lib/prisma";

// Role with included relations from Prisma query
interface RoleWithRelations {
  id: number;
  key: string | null;
  level: number;
  is_leadership: boolean;
  category: string | null;
  parent_id: number | null;
  priority: number;
  department: {
    id: number;
    name: string;
  } | null;
  Staff: Array<{
    id: number;
    users: {
      name: string | null;
      email: string;
    };
  }>;
}

// Hierarchical role structure for response
interface HierarchicalRole {
  id: string;
  key: string;
  level: number;
  is_leadership: boolean;
  category: string;
  parent_id: number | null;
  department: { id: string; name: string } | null;
  Children: HierarchicalRole[];
  Staff: Array<{ id: string; name: string; email: string }>;
}

// GET Method - Role hierarchy
export async function GET(request: NextRequest) {
  try {
    // REQUIRED: Auth check - Staff required for role hierarchy
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const user = authResult.user!;

    // Fetch all roles with hierarchical relationships and staff
    const allRoles = await prisma.role.findMany({
      include: {
        department: true,
        staff: {
          include: {
            users: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        priority: 'asc'
      }
    });

    // Build hierarchical structure
    const roleMap = new Map();
    
    // First pass: create role objects
    allRoles.forEach((role: RoleWithRelations) => {
      roleMap.set(role.id, {
        id: role.id.toString(),
        key: role.key ?? 'UNKNOWN_ROLE',
        level: role.level,
        is_leadership: role.is_leadership,
        category: role.category ?? '',
        parent_id: role.parent_id,
        Department: role.department ? {
          id: role.department.id.toString(),
          name: role.department.name
        } : null,
        Children: [],
        Staff: role.staff?.map((staff) => ({
          id: staff.id.toString(),
          users: {
            name: staff.users.name,
            email: staff.users.email
          }
        })) || []
      });
    });

    // Second pass: build parent-child relationships
    roleMap.forEach(role => {
      if (role.parent_id) {
        const parent = roleMap.get(role.parent_id);
        if (parent) {
          parent.Children.push(role);
        }
      }
    });

    // Get top-level roles (no parent)
    const topLevelRoles = Array.from(roleMap.values()).filter(role => !role.parent_id);

    return NextResponse.json({ 
      roles: topLevelRoles,
      totalRoles: allRoles.length,
      message: "Hierarchical role structure retrieved" 
    });

  } catch (error: unknown) {
    console.error('Role Hierarchy API Error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

 
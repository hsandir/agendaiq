import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from '@/lib/auth/policy';
import { prisma } from "@/lib/prisma";

// Role with included relations from Prisma query
interface RoleWithRelations {
  id: number;
  title: string;
  level: number;
  is_leadership: boolean;
  category: string | null;
  parent_id: number | null;
  priority: number;
  department: {
    id: number;
    name: string
  } | null;
  staff: Array<{
    id: number;
    users: {
      id: number;
      name: string | null;
      email: string;
      image?: string | null;
    };
    role_id: number;
    department: {
      id: number;
      name: string
    } | null;
  }>;
}

// Hierarchical role structure for response
interface HierarchicalRole {
  id: string;
  title: string;
  level: number;
  is_leadership: boolean;
  category: string;
  priority: number;
  parent_id: number | null;
  department: { id: string; name: string } | null;
  children: HierarchicalRole[];
  staff: Array<{ 
    id: string; 
    users: {
      id: number;
      name: string | null; 
      email: string;
      image?: string | null;
    };
    role_id: number;
    department?: {
      id: number;
      name: string
    } | null;
  }>;
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
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            department: {
              select: {
                id: true,
                name: true
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
        title: role.title,
        level: role.level,
        is_leadership: role.is_leadership,
        category: role.category ?? 'General',
        priority: role.priority,
        parent_id: role.parent_id,
        department: role.department ? {
          id: role.department.id.toString(),
          name: role.department.name
        } : null,
        children: [],
        staff: role.staff?.map((staff) => ({
          id: staff.id.toString(),
          users: {
            id: staff.users.id,
            name: staff.users.name,
            email: staff.users.email,
            image: staff.users.image
          },
          role_id: staff.role_id,
          department: staff.department
        })) || []
      });
    });

    // Second pass: build parent-child relationships
    roleMap.forEach(role => {
      if (role.parent_id) {
        const parent = roleMap.get(role.parent_id);
        if (parent) {
          parent.children.push(role);
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

 
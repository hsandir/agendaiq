import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

// GET Method - Role hierarchy
export async function GET(request: NextRequest) {
  try {
    // REQUIRED: Auth check - Staff required for role hierarchy
    const authResult = await withAuth(request, { requireStaff: true });
    
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
        Department: true,
        Staff: {
          include: {
            User: {
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
    allRoles.forEach((role: any) => {
      roleMap.set(role.id, {
        id: role.id.toString(),
        title: role.title,
        level: role.level,
        is_leadership: role.is_leadership,
        category: role.category,
        parent_id: role.parent_id,
        Department: role.Department ? {
          id: role.Department.id.toString(),
          name: role.Department.name
        } : null,
        Children: [],
        Staff: role.Staff?.map((staff: any) => ({
          id: staff.id.toString(),
          User: {
            name: staff.User.name,
            email: staff.User.email
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

  } catch (error) {
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

 
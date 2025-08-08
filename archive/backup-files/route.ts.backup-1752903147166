import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/roles/hierarchy - Get role hierarchy
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user to check if they're admin
    const user = await prisma.user.findUnique({
      where: { email: user.email },
      include: { 
        Staff: {
          include: { 
            Role: {
              include: { Department: true }
            }
          }
        }
      }
    });

    if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== "Administrator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch all roles with basic relationships
    const allRoles = await prisma.role.findMany({
      include: {
        Department: true,
        Staff: {
          include: {
            User: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { priority: 'asc' }
      ]
    });

    // Build hierarchy tree programmatically
    const roleMap = new Map();
    
    // First pass: create role objects
    allRoles.forEach(role => {
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
      totalRoles: allRoles.length 
    });
  } catch (error) {
    console.error("Error fetching role hierarchy:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user to check if they're admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Staff: {
          include: { Role: {
              include: { Department: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== "Administrator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      include: { Department: true
      },
      orderBy: [
        { Department: { name: 'asc' } },
        { priority: 'asc' }
      ],
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Staff: {
          include: { Role: {
              include: { Department: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== "Administrator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { title, priority, category, department_id } = body;

    if (!title || !department_id) {
      return NextResponse.json(
        { error: "Title and department_id are required" },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        title,
        priority: priority || 10,
        category,
        department_id: Number(department_id),
      },
      include: { Department: true
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/roles - Update a role
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Staff: {
          include: { Role: {
              include: { Department: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== "Administrator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { title, priority, category, department_id } = body;

    const role = await prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        title,
        priority,
        category,
        ...(department_id && { department_id: Number(department_id) })
      },
      include: { Department: true
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 
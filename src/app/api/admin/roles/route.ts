import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Helper function to verify admin access
async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      Staff: {
        include: {
          Role: true
        }
      }
    }
  });

  if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== 'Administrator') {
    return null;
  }

  return user;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 }
    );
  }

  try {
    // Get all roles from the database
    const roles = await prisma.role.findMany({
      include: {
        Department: true,
        Staff: {
          include: {
            User: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, priority, category, department_id } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Role title is required" },
        { status: 400 }
      );
    }

    // Create the new role
    const newRole = await prisma.role.create({
      data: {
        title,
        priority: priority || 10,
        category,
        department_id
      },
      include: {
        Department: true
      }
    });

    return NextResponse.json(newRole);
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
} 
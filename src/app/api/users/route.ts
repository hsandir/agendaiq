import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { withAuth } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireStaff: true });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const user = authResult.user!;

    const userWithStaff = await prisma.user.findUnique({
      where: { email: user.email },
      include: { 
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });

    if (!userWithStaff) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has admin privileges
    const isAdmin = userWithStaff.Staff?.[0]?.Role?.title === 'Administrator';

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can view all users" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
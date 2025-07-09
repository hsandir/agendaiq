import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        staff: {
          include: {
            role: true
          }
        }
      },
    });

    if (!user || user.staff?.[0]?.role?.title !== "Administrator") {
      return NextResponse.json(
        { error: "Only administrators can view all users" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      include: {
        staff: {
          include: {
            role: true,
            department: true,
            school: true
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
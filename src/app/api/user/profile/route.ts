import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        staff: {
          include: {
            role: true,
            department: true,
            school: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform user data to include staff information
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      staff: user.staff?.[0] ? {
        role: user.staff[0].role?.title,
        department: user.staff[0].department?.name,
        school: user.staff[0].school?.name
      } : null
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image } = body;

    const user = await prisma.user.update({
      where: { email: user.email },
      data: {
        name,
        image,
      },
      include: {
        staff: {
          include: {
            role: true,
            department: true,
            school: true
          }
        }
      }
    });

    // Transform user data to include staff information
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      staff: user.staff?.[0] ? {
        role: user.staff[0].role?.title,
        department: user.staff[0].department?.name,
        school: user.staff[0].school?.name
      } : null
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
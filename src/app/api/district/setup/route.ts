import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with staff to check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
              include: { Staff: { include: { Role: true } } },
    });

    if (!user || !user.Staff?.[0]?.Role?.title || user.Staff[0].Role.title !== "Administrator") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: "District name is required" },
        { status: 400 }
      );
    }

    // Check if district already exists
    const existingDistrict = await prisma.district.findFirst({
      where: { name: name.trim() },
    });

    if (existingDistrict) {
      return NextResponse.json(
        { error: "District already exists" },
        { status: 409 }
      );
    }

    // Create district
    const district = await prisma.district.create({
      data: {
        name: name.trim(),
        address: address?.trim(),
      },
    });

    return NextResponse.json(district);
  } catch (error) {
    console.error("Error creating district:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
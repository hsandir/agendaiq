import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { Prisma } from "@prisma/client";

// GET /api/schools - List all schools
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        code: true,
        district_id: true,
        // TODO: Add these fields to School model in schema
        // city: true,
        // state: true,
        // zipCode: true,
        // phone: true,
        // website: true,
        // logo: true,
      },
    });

    return new NextResponse(JSON.stringify(schools), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/schools:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/schools - Create a new school
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { Staff: { include: { Role: true } } },
    });

    if (user?.Staff?.[0]?.Role?.title !== "Administrator") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { name, address, city, state, zipCode, phone, website, logo } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new NextResponse("School name is required", { status: 400 });
    }

    const school = await prisma.school.create({
      data: {
        name: name.trim(),
        address: address?.trim(),
        code: `SCH${Date.now().toString().slice(-6)}`, // Generate unique code
        district_id: 1, // TODO: Get from request or user's district
        // TODO: Add these fields to School model in schema
        // city: city?.trim(),
        // state: state?.trim(),
        // zipCode: zipCode?.trim(),
        // phone: phone?.trim(),
        // website: website?.trim(),
        // logo: logo?.trim(),
      },
    });

    return new NextResponse(JSON.stringify(school), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/schools:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new NextResponse("School with this name already exists", {
          status: 409,
        });
      }
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

 
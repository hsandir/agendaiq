import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from "@/lib/auth/policy";
import { Prisma } from "@prisma/client";

// GET /api/schools - List all schools
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.SCHOOL_VIEW });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        code: true,
        district_id: parseInt(true),
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
  } catch (error: unknown) {
    console.error("Error in GET /api/schools:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/schools - Create a new school
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.SCHOOL_MANAGE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const body = await request.json() as Record<string, unknown>;
    const { _name, _address, _city, _state, _zipCode, _phone, _website, _logo } = body as { name?: string; address?: string; city?: string; state?: string; zipCode?: string; phone?: string; website?: string; logo?: string };

    if (!name || typeof name !== "string" || String(name).trim().length === 0) {
      return new NextResponse("School name is required", { status: 400 });
    }

    const school = await prisma.school.create({
      data: {
        name: String(name).trim(),
        address: address?.trim(),
        code: `SCH${Date.now().toString().slice(-6)}`, // Generate unique code
        district_id: parseInt(1), // TODO: Get from request or user's district
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
  } catch (error: unknown) {
    console.error("Error in POST /api/schools:", error);
    if (error instanceof Prisma?.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new NextResponse("School with this name already exists", {
          status: 409,
        });
      }
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

 
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from "@/lib/auth/policy";

// GET /api/setup - Get district setup information
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.SCHOOL_VIEW });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const schools = await prisma.school.findMany({
      include: { 
        district: true,
        department: true,
      },
    });

    return NextResponse.json(schools);
  } catch (error: unknown) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/setup/district - Create or update district
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_UPDATE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const body = await request.json() as Record<string, unknown>;
    const { districtName, schoolName, address } = body;

    if (!districtName || !schoolName) {
      return NextResponse.json(
        { error: "District name and school name are required" },
        { status: 400 }
      );
    }

    // Create or find district
    let district = await prisma.district.findFirst({
      where: { name: districtName },
    });

    if (!district) {
      district = await prisma.district.create({
        data: {
          name: (districtName as string)?.trim(),
        },
      });
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name: (schoolName as string)?.trim(),
        address: (address as string | undefined)?.trim(),
        code: `SCH${Date.now().toString().slice(-6)}`, // Generate unique code
        district_id: district?.id ?? 0,
      },
    });

    return NextResponse.json({ district, school });
  } catch (error: unknown) {
    console.error("Error creating school setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/setup/import - Import data from Excel
export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_UPDATE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const body = await request.json() as Record<string, unknown>;
    const { districtName, schoolName, address } = body;

    if (!districtName || !schoolName) {
      return NextResponse.json(
        { error: "District name and school name are required" },
        { status: 400 }
      );
    }

    // Update existing district and school
    const district = await prisma.district.findFirst({
      where: { name: districtName },
    });

    if (!district) {
      return NextResponse.json(
        { error: "District not found" },
        { status: 404 }
      );
    }

    const updatedDistrict = await prisma.district.update({
      where: { id: district?.id },
      data: {
        name: (districtName as string)?.trim(),
      },
    });

    const school = await prisma.school.findFirst({
      where: { district_id: district?.id ?? 0 },
    });

    if (school) {
      const updatedSchool = await prisma.school.update({
        where: { id: school?.id },
        data: {
          name: String(schoolName || '').trim(),
          address: String(address || '').trim(),
        },
      });

      return NextResponse.json({ district: updatedDistrict, school: updatedSchool });
    }

    return NextResponse.json({ district: updatedDistrict });
  } catch (error: unknown) {
    console.error("Error updating school setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
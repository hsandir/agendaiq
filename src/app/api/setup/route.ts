import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/setup - Get district setup information
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schools = await prisma.school.findMany({
      include: { District: true,
        departments: true,
      },
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/setup/district - Create or update district
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Staff: { include: { Role: true } } },
    });

    if (!user || user.staff?.Role?.title !== 'Administrator') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
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
          name: districtName?.trim(),
        },
      });
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name: schoolName?.trim(),
        address: address?.trim(),
        district_id: district.id,
      },
    });

    return NextResponse.json({ district, school });
  } catch (error) {
    console.error("Error creating school setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/setup/import - Import data from Excel
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Staff: { include: { Role: true } } },
    });

    if (!user || user.staff?.Role?.title !== 'Administrator') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
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
      where: { id: district.id },
      data: {
        name: districtName?.trim(),
      },
    });

    const school = await prisma.school.findFirst({
      where: { district_id: district.id },
    });

    if (school) {
      const updatedSchool = await prisma.school.update({
        where: { id: school.id },
        data: {
          name: schoolName?.trim(),
          address: address?.trim(),
        },
      });

      return NextResponse.json({ district: updatedDistrict, school: updatedSchool });
    }

    return NextResponse.json({ district: updatedDistrict });
  } catch (error) {
    console.error("Error updating school setup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
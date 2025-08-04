import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

// GET /api/school - Get all schools (admin) or user's school (non-admin)
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireStaff: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;

  try {
    // Get user and check role through staff
    const userRecord = await prisma.user.findUnique({
      where: { email: user.email },
      include: { 
        Staff: {
          include: {
            Role: true,
            School: {
              include: {
                District: true
              }
            }
          }
        }
      },
    });

    if (!userRecord || !userRecord.Staff || userRecord.Staff.length === 0) {
      return NextResponse.json({ error: "User staff record not found" }, { status: 404 });
    }

    const staffRecord = userRecord.Staff[0];

    if (staffRecord.Role?.title === "Administrator") {
      // Admin: return all schools
      const schools = await prisma.school.findMany({
        include: { District: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(schools);
    } else {
      // Non-admin: return only user's school
      if (!staffRecord.School) {
        return NextResponse.json({ error: "No school assigned" }, { status: 404 });
      }
      return NextResponse.json([staffRecord.School]);
    }
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/school - Create a new school (admin only)
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireAdminRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const body = await request.json();
    const { name, code, address, phone, email, district_id } = body;

    if (!name || !code || !district_id) {
      return NextResponse.json(
        { error: "Name, code, and district_id are required" },
        { status: 400 }
      );
    }

    // Check if school code already exists
    const existingSchool = await prisma.school.findUnique({
      where: { code },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: "School code already exists" },
        { status: 409 }
      );
    }

    // Verify district exists
    const district = await prisma.district.findUnique({
      where: { id: district_id },
    });

    if (!district) {
      return NextResponse.json(
        { error: "District not found" },
        { status: 404 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name,
        code,
        address,
        phone,
        email,
        district_id,
      },
      include: {
        District: true,
      },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/school - Update a school (admin only)
export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireAdminRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const body = await request.json();
    const { id, name, code, address, phone, email, district_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id },
    });

    if (!existingSchool) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // If code is being changed, check for conflicts
    if (code && code !== existingSchool.code) {
      const codeConflict = await prisma.school.findUnique({
        where: { code },
      });

      if (codeConflict) {
        return NextResponse.json(
          { error: "School code already exists" },
          { status: 409 }
        );
      }
    }

    // If district is being changed, verify it exists
    if (district_id && district_id !== existingSchool.district_id) {
      const district = await prisma.district.findUnique({
        where: { id: district_id },
      });

      if (!district) {
        return NextResponse.json(
          { error: "District not found" },
          { status: 404 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (district_id !== undefined) updateData.district_id = district_id;

    const school = await prisma.school.update({
      where: { id },
      data: updateData,
      include: {
        District: true,
      },
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error("Error updating school:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
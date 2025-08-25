import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '../../../lib/auth/api-auth';
import { Capability } from '../../../lib/auth/policy';
import { prisma } from "../../../lib/prisma";

// School update data interface
interface SchoolUpdateData {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  district_id?: number;
}

// GET /api/school - Get all schools (admin) or user's school (non-admin)
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.SCHOOL_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;

  try {
    // Get user and check role through staff
    const userRecord = await prisma.users.findUnique({
      where: { email: user.email },
      include: { 
        staff: {
          include: {
            role: true,
            school: {
              include: {
                district: true
              }
            }
          }
        }
      },
    });

    if (!userRecord || !userRecord.staff || userRecord.staff.length === 0) {
      return NextResponse.json({ error: "User staff record not found" }, { status: 404 });
    }

    const staffRecord = userRecord.staff[0];

    if (staffRecord.role?.title === "Administrator") {
      // Admin: return all schools
      const schools = await prisma.school.findMany({
        include: { district: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(schools);
    } else {
      // Non-admin: return only user's school
      if (!staffRecord.school) {
        return NextResponse.json({ error: "No school assigned" }, { status: 404 });
      }
      return NextResponse.json(staffRecord.school);
    }
  } catch (error: unknown) {
    console.error("Error fetching schools:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/school - Create a new school (admin only)
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.SCHOOL_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const { name, code, address, phone, email, district_id } = body;

    if (!name || !code || !district_id) {
      return NextResponse.json(
        { error: "Name, code, and district_id are required" },
        { status: 400 }
      );
    }

    // Check if school code already exists
    const existingSchool = await prisma.school.findFirst({
      where: { code: code as string },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: "School code already exists" },
        { status: 409 }
      );
    }

    // Verify district exists
    const district = await prisma.district.findUnique({
      where: { id: district_id as number },
    });

    if (!district) {
      return NextResponse.json(
        { error: "District not found" },
        { status: 404 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name: name as string,
        code: code as string,
        address: address as string | undefined,
        // TODO: Add phone and email fields to School model in schema
        // phone,
        // email,
        district_id: district_id as number,
      },
      include: {
        district: true,
      },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating school:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/school - Update a school (admin only)
export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.SCHOOL_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const { id, name, code, address, phone, email, district_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id: id as number },
    });

    if (!existingSchool) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // If code is being changed, check for conflicts
    if (code && code !== existingSchool.code) {
      const codeConflict = await prisma.school.findFirst({
        where: { code: code as string },
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
        where: { id: district_id as number },
      });

      if (!district) {
        return NextResponse.json(
          { error: "District not found" },
          { status: 404 }
        );
      }
    }

    const updateData: SchoolUpdateData = {};
    if (name !== undefined) updateData.name = name as string;
    if (code !== undefined) updateData.code = code as string;
    if (address !== undefined) updateData.address = address as string;
    if (phone !== undefined) updateData.phone = phone as string;
    if (email !== undefined) updateData.email = email as string;
    if (district_id !== undefined) updateData.district_id = district_id as number;

    const school = await prisma.school.update({
      where: { id: id as number },
      data: updateData,
      include: {
        district: true,
      },
    });

    return NextResponse.json(school);
  } catch (error: unknown) {
    console.error("Error updating school:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
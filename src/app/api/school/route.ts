import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/school - Get all schools (admin) or user's school (non-admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and check role through staff
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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

    if (!user || !user.staff || user.staff.length === 0) {
      return NextResponse.json({ error: "User staff record not found" }, { status: 404 });
    }

    const staffRecord = user.staff[0];

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
      return NextResponse.json([staffRecord.school]);
    }
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/school - Create a new school (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
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
    
    if (!user || !user.staff?.[0] || user.staff[0].role?.title !== "Administrator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, address, city, state, zipCode, phone, website } = body;
    
    // Get or create district first
    let district = await prisma.district.findFirst();
    if (!district) {
      district = await prisma.district.create({
        data: {
          name: name || 'Default District',
          address,
        },
      });
    }
    
    const school = await prisma.school.create({
      data: {
        name,
        address,
        district_id: district.id,
      },
      include: { district: true },
    });
    
    return NextResponse.json(school);
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/school?id=schoolId - Update a school by ID (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
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
    
    if (!user || !user.staff?.[0] || user.staff[0].role?.title !== "Administrator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, address } = body;
    
    const school = await prisma.school.update({
      where: { id: parseInt(id) },
      data: { name, address },
      include: { district: true },
    });
    
    return NextResponse.json(school);
  } catch (error) {
    console.error("Error updating school:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/school?id=schoolId - Delete a school by ID (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
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
    
    if (!user || !user.staff?.[0] || user.staff[0].role?.title !== "Administrator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }
    
    await prisma.school.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting school:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/school - Get all schools (admin) or user's school (non-admin)
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and check role through staff
    const user = await prisma.user.findUnique({
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

    if (!user || !user.Staff || user.Staff.length === 0) {
      return NextResponse.json({ error: "User staff record not found" }, { status: 404 });
    }

    const staffRecord = user.Staff[0];

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
export const POST = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: user.email },
      include: { 
        Staff: {
          include: {
            Role: true
          }
        }
      },
    });
    
    if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== "Administrator") {
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
      include: { District: true },
    });
    
    return NextResponse.json(school);
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/school?id=schoolId - Update a school by ID (admin only)
export const PUT = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: user.email },
      include: { 
        Staff: {
          include: {
            Role: true
          }
        }
      },
    });
    
    if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== "Administrator") {
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
      include: { District: true },
    });
    
    return NextResponse.json(school);
  } catch (error) {
    console.error("Error updating school:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/school?id=schoolId - Delete a school by ID (admin only)
export const DELETE = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: user.email },
      include: { 
        Staff: {
          include: {
            Role: true
          }
        }
      },
    });
    
    if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== "Administrator") {
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
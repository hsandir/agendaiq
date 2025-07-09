import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const createAdminSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Admin user already exists" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = createAdminSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;
    
    const hashedPassword = await hash(password, 12);
    
    // Generate a unique staffId for the admin
    const staffId = `ADMIN-${Date.now()}`;
    
    // First, create a district if none exists
    let district = await prisma.district.findFirst();
    if (!district) {
      district = await prisma.district.create({
        data: {
          name: "Main District",
          code: "MAIN",
          address: "Main Office"
        }
      });
    }

    // Create a school if none exists
    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: "Main School",
          code: "MAIN",
          address: "Main Campus",
          district_id: district.id
        }
      });
    }

    // Create the administration department
    let department = await prisma.department.findFirst({
      where: { code: "ADMIN" }
    });
    if (!department) {
      department = await prisma.department.create({
        data: {
          name: "Administration",
          code: "ADMIN",
          category: "Administration",
          school_id: school.id
        }
      });
    }

    // Create the administrator role
    let role = await prisma.role.findFirst({
      where: { title: "Administrator" }
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          title: "Administrator",
          priority: 0, // Highest priority
          category: "Administration",
          department_id: department.id
        }
      });
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: email,
        name: "System Administrator",
        staff_id: staffId,
        hashedPassword: hashedPassword,
        emailVerified: new Date()
      }
    });

    // Create the staff record linking user to role, department, school, and district
    const staff = await prisma.staff.create({
      data: {
        user_id: user.id,
        department_id: department.id,
        role_id: role.id,
        school_id: school.id,
        district_id: district.id,
        flags: ["admin"],
        endorsements: []
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        staffId: user.staff_id
      },
      staff: {
        id: staff.id,
        role: role.title,
        department: department.name,
        school: school.name,
        district: district.name
      }
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create admin user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Check if this is the first user
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
      },
    });

    // Create staff record if this is the first user (admin)
    if (isFirstUser) {
      // Find or create Administrator role
      const adminRole = await prisma.role.findFirst({
        where: { title: 'Administrator' },
      });

      if (adminRole) {
        // Get default school and district for staff record
        const defaultSchool = await prisma.school.findFirst();
        const defaultDistrict = await prisma.district.findFirst();

        if (defaultSchool && defaultDistrict) {
          // Get default department for admin
          const defaultDepartment = await prisma.department.findFirst();
          
          if (defaultDepartment) {
            await prisma.staff.create({
              data: {
                user_id: user.id,
                role_id: adminRole.id,
                school_id: defaultSchool.id,
                district_id: defaultDistrict.id,
                department_id: defaultDepartment.id,
              },
            });
          }
        }
      }
    }

    // Get user with staff for response
    const userWithStaff = await prisma.user.findUnique({
      where: { id: user.id },
      include: { staff: { include: { role: true } } },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        staff: userWithStaff?.staff,
      },
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
} 
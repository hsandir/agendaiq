import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { RateLimiters, getClientIdentifier } from "../../../../lib/utils/rate-limit";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    // SECURITY FIX: Add rate limiting for signup attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await RateLimiters.registration.check(request, 3, clientId); // 3 signups per hour
    
    if (!rateLimitResult.success) {
      return RateLimiters.registration.createErrorResponse(rateLimitResult);
    }

    const body = await request.json() as Record<string, unknown>;

    // SECURITY FIX: Add input validation schema
    const signupSchema = z.object({
      email: z.string().email("Invalid email format").toLowerCase(),
      password: z.string().min(8, "Password must be at least 8 characters")
    });

    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validationResult.error.errors.map(e => (e instanceof Error ? e.message : String(e)))
        }, 
        { status: 400 }
      );
    }

    const { _email, _password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashed_password = await hash(password, 12);

    // Check if this is the first user
    const userCount = await prisma.users.count();
    const isFirstUser = userCount === 0;

    // Create user
    const user = await prisma.users.create({
      data: {
        email,
        hashed_password,
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
                user_id: parseInt(user.id),
                role_id: parseInt(adminRole.id),
                school_id: parseInt(defaultSchool.id),
                district_id: parseInt(defaultDistrict.id),
                department_id: parseInt(defaultDepartment.id),
              },
            });
          }
        }
      }
    }

    // Get user with staff for response
    const userWithStaff = await prisma.users.findUnique({
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
  } catch (error: unknown) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
} 
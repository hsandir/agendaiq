import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const createAdminSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAdminRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    const body = await request.json();
    const validationResult = createAdminSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;
    
    // Check if user exists and has admin role
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has admin role
    const hasAdminRole = existingUser.Staff.some(staff => 
      staff.Role?.title === 'Administrator'
    );

    if (!hasAdminRole) {
      return NextResponse.json(
        { error: "User does not have admin role" },
        { status: 403 }
      );
    }

    // Check if user already has a password
    if (existingUser.hashedPassword) {
      return NextResponse.json(
        { error: "Admin user already has a password set" },
        { status: 400 }
      );
    }
    
    const hashedPassword = await hash(password, 12);
    
    // Update the user with the new password
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        hashedPassword: hashedPassword,
        emailVerified: new Date()
      },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true,
            District: true
          }
        }
      }
    });

    const staff = updatedUser.Staff.find(s => s.Role?.title === 'Administrator');

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        staffId: updatedUser.staff_id
      },
      staff: staff ? {
        id: staff.id,
        role: staff.Role?.title,
        department: staff.Department?.name,
        school: staff.School?.name,
        district: staff.District?.name
      } : null
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
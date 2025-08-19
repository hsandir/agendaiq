import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RateLimiters, getClientIdentifier } from "@/lib/utils/rate-limit";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    // Rate limiting for registration attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await RateLimiters.registration.check(request, 3, clientId); // 3 registrations per hour
    
    if (!rateLimitResult.success) {
      return RateLimiters.registration.createErrorResponse(rateLimitResult);
    }

    const body = await request.json();

    // SECURITY FIX: Add input validation schema
    const registerSchema = z.object({
      email: z.string().email("Invalid email format").toLowerCase(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1, "Name is required").optional()
    });

    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validationResult.error.errors.map(e => (e instanceof Error ? e.message : String(e)))
        }, 
        { status: 400 }
      );
    }

    const { __email, __password, __name  } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
      },
    });

    return new NextResponse(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in register:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
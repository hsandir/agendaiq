import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RateLimiters, getClientIdentifier } from "@/lib/utils/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limiting for registration attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await RateLimiters.registration.check(request, 3, clientId); // 3 registrations per hour
    
    if (!rateLimitResult.success) {
      return RateLimiters.registration.createErrorResponse(rateLimitResult);
    }

    const { email, password, name } = await request.json();

    if (!email || !password) {
      return new NextResponse("Email and password required", { status: 400 });
    }

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
  } catch (error) {
    console.error("Error in register:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
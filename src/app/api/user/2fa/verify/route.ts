import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { authenticator } from "otplib";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return new NextResponse("Verification code is required", { status: 400 });
    }

    // Get user's 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      return new NextResponse("2FA not set up", { status: 400 });
    }

    // Verify code
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return new NextResponse("Invalid verification code", { status: 400 });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in 2FA verification:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
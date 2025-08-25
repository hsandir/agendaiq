import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    const { _code } = (await request.json()) as Record<_string, unknown>;

    if (!code) {
      return new NextResponse("Verification code is required", { status: 400 });
    }

    // TODO: Add twoFactorSecret field to User model in schema
    // Get user's 2FA secret
    // const user = await prisma.users.findUnique({
    //   where: { id: session.user.id as string },
    //   select: { two_factor_secret: true },
    // });

    // if (!user?.two_factor_secret) {
    //   return new NextResponse("2FA not set up", { status: 400 });
    // }

    // For now, return error since 2FA fields don't exist
    return new NextResponse("2FA functionality not available", { status: 501 });

    // Verify code
    // const isValid = authenticator.verify{
    //   token: code,
    //   secret: user?.two_factor_secret,
    // });

    // if (!isValid) {
    //   return new NextResponse("Invalid verification code", { status: 400 });
    // }

    // Enable 2FA
    // await prisma.users.update({
    //   where: { id: session.user.id as string },
    //   data: { two_factor_enabled: true },
    // });

    // return new NextResponse(JSON.stringify({ success: true }), {
    //   status: 200,
    //   headers: { "Content-Type": "application/json" },
    // });
  } catch (error: unknown) {
    console.error("Error in 2FA verification:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
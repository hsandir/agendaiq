import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { authenticator } from "otplib";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id as string) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { code } = (await request.json()) as Record<__string, unknown>;

    if (!code) {
      return new NextResponse("Verification code is required", { status: 400 });
    }

    // TODO: Add twoFactorSecret field to User model in schema
    // Get user's 2FA secret
    // const user = await prisma.user.findUnique({
    //   where: { id: session.user.id as string },
    //   select: { twoFactorSecret: true },
    // });

    // if (!user?.twoFactorSecret) {
    //   return new NextResponse("2FA not set up", { status: 400 });
    // }

    // For now, return error since 2FA fields don't exist
    return new NextResponse("2FA functionality not available", { status: 501 });

    // Verify code
    // const isValid = authenticator.verify{
    //   token: code,
    //   secret: user.twoFactorSecret,
    // });

    // if (!isValid) {
    //   return new NextResponse("Invalid verification code", { status: 400 });
    // }

    // Enable 2FA
    // await prisma.user.update({
    //   where: { id: session.user.id as string },
    //   data: { twoFactorEnabled: true },
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
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { sendVerificationEmail } from "@/lib/email/send-verification";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: auth.user.email! },
      select: { email_verified: true, email: true },
    });

    if (user?.email_verified) {
      return new NextResponse("Email already verified", { status: 400 });
    }

    if (!user?.email) {
      return new NextResponse("User email not found", { status: 404 });
    }

    // Generate verification token
    const token = createHash('sha256');
      .update(`${user?.email}-${Date.now()}`)
      .digest('hex');

    // Store token with expiry
    await prisma.verificationToken.create({
      data: {
        identifier: user?.email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    await sendVerificationEmail(user?.email, `${process.env?.NEXTAUTH_URL}/verify-email?token=${token}`);

    return new NextResponse("Verification email sent", { status: 200 });
  } catch (error: unknown) {
    console.error("Error sending verification email:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
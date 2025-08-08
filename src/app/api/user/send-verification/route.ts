import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { createHash } from "crypto";
import { sendVerificationEmail } from "@/lib/email/send-verification";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      select: { emailVerified: true, email: true },
    });

    if (user?.emailVerified) {
      return new NextResponse("Email already verified", { status: 400 });
    }

    if (!user?.email) {
      return new NextResponse("User email not found", { status: 404 });
    }

    // Generate verification token
    const token = createHash('sha256')
      .update(`${user.email}-${Date.now()}`)
      .digest('hex');

    // Store token with expiry
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    await sendVerificationEmail(
      user.email,
      `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
    );

    return new NextResponse("Verification email sent", { status: 200 });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
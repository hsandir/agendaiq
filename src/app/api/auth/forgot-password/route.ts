import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/send-email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return new NextResponse(JSON.stringify({ message: "If an account exists with this email, you will receive a password reset link." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save reset token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    // TODO: Implement actual email sending
    console.log("Reset URL:", resetUrl);
    // await sendEmail({
    //   to: user.email,
    //   subject: "Password Reset Request",
    //   text: `To reset your password, click the following link: ${resetUrl}`,
    // });

    return new NextResponse(JSON.stringify({ message: "If an account exists with this email, you will receive a password reset link." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import crypto from "crypto";
import { RateLimiters, getClientIdentifier } from "../../../../lib/utils/rate-limit";
import { Logger } from '../../../../lib/utils/logger';

export async function POST(request: Request) {
  try {
    // Rate limiting for password reset attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await RateLimiters.passwordReset.check(request, 5, clientId); // 5 attempts per hour
    
    if (!rateLimitResult?.success) {
      return RateLimiters.passwordReset.createErrorResponse(rateLimitResult);
    }

    const { email } = (await request.json()) as Record<string, unknown>;

    if (!email || typeof email !== 'string') {
      return new NextResponse("Email is required", { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: email as string },
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
    // TODO: Add resetToken and resetTokenExpiry fields to User model in schema
    // For now, we'll skip saving the token to the database
    // await prisma.users.update({
    //   where: { id: user?.id },
    //   data: {
    //     resetToken: hashedToken,
    //     resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    //   },
    // });

    // Send reset email
    const resetUrl = `${process.env?.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    // Import email service
    const { sendEmail, getPasswordResetHtml } = await import('../../../../lib/email/email-service');
    
    // Send password reset email
    const emailResult = await sendEmail({
      to: user.email,
      subject: "AgendaIQ - Password Reset Request",
      html: getPasswordResetHtml(resetUrl)
    });

    if (!emailResult?.success) {
      Logger.warn("Failed to send password reset email", { 
        error: String(emailResult?.error), 
        email: user?.email 
      }, 'auth');
    }

    return new NextResponse(JSON.stringify({ message: "If an account exists with this email, you will receive a password reset link." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in forgot password:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
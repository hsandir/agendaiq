import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";
import { sendEmail, getTwoFactorCodeHtml } from "@/lib/email/email-service";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // TODO: Add twoFactorSecret and twoFactorEnabled fields to User model in schema
    // Save secret to user
    // await prisma.(user as Record<string, unknown>).update({
    //   where: { id: session.user.id as string },
    //   data: {
    //     two_factor_secret: secret,
    //     two_factor_enabled: false, // Will be enabled after verification
    //   },
    // });

    // Generate QR code URL
    const otpauth = authenticator.keyuri(
      auth.user.email!,
      "AgendaIQ",
      secret
    );

    // Send backup codes via email
    await sendEmail({
      to: auth.user.email!,
      subject: "Two-Factor Authentication Setup - AgendaIQ",
      html: getTwoFactorCodeHtml(secret),
    });

    return new NextResponse(JSON.stringify({ qrCode: otpauth }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in 2FA setup:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
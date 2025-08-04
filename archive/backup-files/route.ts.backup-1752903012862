import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { authenticator } from "otplib";
import { sendEmail, getTwoFactorCodeHtml } from "@/lib/email/email-service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Save secret to user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false, // Will be enabled after verification
      },
    });

    // Generate QR code URL
    const otpauth = authenticator.keyuri(
      session.user.email!,
      "AgendaIQ",
      secret
    );

    // Send backup codes via email
    await sendEmail({
      to: session.user.email!,
      subject: "Two-Factor Authentication Setup - AgendaIQ",
      html: getTwoFactorCodeHtml(secret),
    });

    return new NextResponse(JSON.stringify({ qrCode: otpauth }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
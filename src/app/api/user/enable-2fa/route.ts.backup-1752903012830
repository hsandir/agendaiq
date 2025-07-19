import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { authenticator } from "otplib";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Save secret and enable 2FA
    await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
      },
    });

    // Generate QR code data
    const otpauth = authenticator.keyuri(
      session.user.email!,
      "AgendaIQ",
      secret
    );

    return new NextResponse(JSON.stringify({ secret, otpauth }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
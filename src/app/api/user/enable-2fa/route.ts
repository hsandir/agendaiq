import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // TODO: Add twoFactorSecret and twoFactorEnabled fields to User model in schema
    // Save secret and enable 2FA
    // await prisma.users.update({
    //   where: { email: session.user?.email! },
    //   data: {
    //     two_factor_secret: secret,
    //     two_factor_enabled: true,
    //   },
    // });

    // Generate QR code data
    const otpauth = authenticator.keyuri(auth.user.email!, "AgendaIQ", secret);

    return new NextResponse(JSON.stringify({ secret, otpauth }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error enabling 2FA:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const user = authResult.user!;
    
    // Check if 2FA is already enabled
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (dbUser?.two_factor_enabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" }, 
        { status: 400 }
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `AgendaIQ (${user.email})`,
      issuer: 'AgendaIQ',
      length: 32
    });

    // Save the secret temporarily (not enabled yet)
    await prisma.(user as Record<string, unknown>).update({
      where: { id: user.id },
      data: {
        two_factor_secret: secret.base32
      }
    });

    // Return the OTP URL directly instead of generating QR code
    return NextResponse.json({
      secret: secret.base32,
      qrCode: secret.otpauth_url || '',
      manualEntryKey: secret.base32
    });

  } catch (error: unknown) {
    console.error('2FA Setup Error:', error);
    return NextResponse.json(
      { error: "Failed to setup 2FA" }, 
      { status: 500 }
    );
  }
}
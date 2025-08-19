import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const user = authResult.user!;
    const body = await request.json();
    
    if (!body.token) {
      return NextResponse.json(
        { error: "Verification token required" }, 
        { status: 400 }
      );
    }

    // Get user with secret
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser?.two_factor_enabled || !dbUser.two_factor_secret) {
      return NextResponse.json(
        { error: "2FA is not enabled" }, 
        { status: 400 }
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: dbUser.two_factor_secret,
      encoding: 'base32',
      token: body.token,
      window: 2
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" }, 
        { status: 400 }
      );
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: []
      }
    });

    return NextResponse.json({
      message: "2FA disabled successfully"
    });

  } catch (error: unknown) {
    console.error('2FA Disable Error:', error);
    return NextResponse.json(
      { error: "Failed to disable 2FA" }, 
      { status: 500 }
    );
  }
}
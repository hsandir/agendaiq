import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";
import crypto from "crypto";

// Generate backup codes
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
  }
  return codes;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult?.success) {
      return NextResponse.json(
        { error: authResult?.error }, 
        { status: authResult?.statusCode }
      );
    }

    const user = authResult.user!;
    const body = await request.json() as Record<string, unknown>;
    
    if (!body?.token) {
      return NextResponse.json(
        { error: "Verification token required" }, 
        { status: 400 }
      );
    }

    // Get user with secret
    const dbUser = await prisma.users.findUnique({
      where: { id: user?.id }
    });

    if (!dbUser?.two_factor_secret) {
      return NextResponse.json(
        { error: "2FA setup not initiated" }, 
        { status: 400 }
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: dbUser?.two_factor_secret,
      encoding: 'base32',
      token: body?.token,
      window: 2
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" }, 
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable 2FA and save backup codes
    await prisma.users.update({
      where: { id: user?.id },
      data: {
        two_factor_enabled: true,
        backup_codes: backupCodes
      }
    });

    return NextResponse.json({
      message: "2FA enabled successfully",
      backup_codes: backupCodes
    });

  } catch (error: unknown) {
    console.error('2FA Verify Error:', error);
    return NextResponse.json(
      { error: "Failed to verify 2FA" }, 
      { status: 500 }
    );
  }
}
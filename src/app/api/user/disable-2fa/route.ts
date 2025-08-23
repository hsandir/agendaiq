import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    // Disable 2FA and remove secret
    // TODO: Add twoFactorEnabled and twoFactorSecret fields to User model in schema
    // await prisma.user.update({
    //   where: { email: auth.user.email! },
    //   data: {
    //     twoFactorEnabled: false,
    //     twoFactorSecret: null,
    //   },
    // });
    
    // For now, return error since 2FA fields don't exist
    return new NextResponse("2FA functionality not available", { status: 501 });

    return new NextResponse("2FA disabled successfully", { status: 200 });
  } catch (error: unknown) {
    console.error("Error disabling 2FA:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
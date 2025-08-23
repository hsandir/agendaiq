import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    // Delete all sessions for the user
    await prisma.session.deleteMany({ where: { userId: auth.user.id } });

    return new NextResponse("All sessions revoked successfully", { status: 200 });
  } catch (error: unknown) {
    console.error("Error revoking sessions:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
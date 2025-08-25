import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    // TODO: Add suspiciousAlerts field to User model in schema
    const user = await prisma.users.findUnique({
      where: { email: auth.user.email! },
      select: { 
        email: true,
        // suspiciousAlerts: true 
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // TODO: Toggle the setting once suspiciousAlerts field is added
    // await prisma.users.update({
    //   where: { email: auth.user.email! },
    //   data: { suspiciousAlerts: !user?.suspiciousAlerts },
    // });

    // For now, return error since suspiciousAlerts field doesn't exist
    return new NextResponse("Suspicious alerts feature not available", { status: 501 });
  } catch (error: unknown) {
    console.error("Error toggling suspicious activity alerts:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
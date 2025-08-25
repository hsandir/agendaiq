import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    // TODO: Add loginNotifications field to User model in schema
    const user = await prisma.users.findUnique({
      where: { email: auth.user.email! },
      select: { 
        email: true,
        // loginNotifications: true 
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // TODO: Toggle the setting once loginNotifications field is added
    // await prisma.users.update({
    //   where: { email: auth.user.email! },
    //   data: { loginNotifications: !user?.loginNotifications },
    // });

    // For now, return error since loginNotifications field doesn't exist
    return new NextResponse("Login notifications feature not available", { status: 501 });
  } catch (error: unknown) {
    console.error("Error toggling login notifications:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
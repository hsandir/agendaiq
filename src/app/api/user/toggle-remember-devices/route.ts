import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    // TODO: Add rememberDevices field to User model in schema
    // Get current user settings
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { 
        id: true,
        // rememberDevices: true 
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // TODO: Toggle remember devices setting once field is added
    // const updatedUser = await prisma.user.update({
    //   where: { id: auth.user.id },
    //   data: { rememberDevices: !user?.rememberDevices },
    // });

    // For now, return error since rememberDevices field doesn't exist
    return new NextResponse("Remember devices feature not available", { status: 501 });
  } catch (error: unknown) {
    console.error("Error toggling remember devices setting:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
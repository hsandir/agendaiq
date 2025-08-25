import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    const { searchParams } = new URL(request?.url);
    const deviceIdStr = searchParams.get("id");

    if (!deviceIdStr) {
      return new NextResponse("Device ID is required", { status: 400 });
    }

    const deviceId = Number(deviceIdStr);
    if (isNaN(deviceId)) {
      return new NextResponse("Invalid device ID", { status: 400 });
    }

    // TODO: Add device model to schema for device management
    // Check if the device belongs to the user
    // const device = await prisma.device.findUnique({
    //   where: { id: deviceId },
    //   select: { user_id: true },
    // });

    // if (!device ?? device.user_id !== auth.user.id) {
    //   return new NextResponse("Device not found", { status: 404 });
    // }

    // // Delete the device
    // await prisma.device.delete({
    //   where: { id: deviceId },
    // });

    // // Log the event
    // await prisma.loginHistory.create({
    //   data: {
    //     user_id: session.user.id as string,
    //     ipAddress: request.headers.get("x-forwarded-for") ?? "unknown",
    //     userAgent: request.headers.get("user-agent") ?? "unknown",
    //     success: true,
    //     event: "DEVICE_REVOKED",
    //   },
    // });
    
    // For now, return error since device model doesn't exist
    return new NextResponse("Device management not available", { status: 501 });
  } catch (error: unknown) {
    console.error("Error revoking device:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
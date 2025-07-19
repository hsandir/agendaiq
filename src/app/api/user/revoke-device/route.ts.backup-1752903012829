import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceIdStr = searchParams.get("id");

    if (!deviceIdStr) {
      return new NextResponse("Device ID is required", { status: 400 });
    }

    const deviceId = Number(deviceIdStr);
    if (isNaN(deviceId)) {
      return new NextResponse("Invalid device ID", { status: 400 });
    }

    // Check if the device belongs to the user
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { user_id: true },
    });

    if (!device || device.user_id !== session.user.id) {
      return new NextResponse("Device not found", { status: 404 });
    }

    // Delete the device
    await prisma.device.delete({
      where: { id: deviceId },
    });

    // Log the event
    await prisma.loginHistory.create({
      data: {
        user_id: session.user.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        success: true,
        event: "DEVICE_REVOKED",
      },
    });

    return new NextResponse("Device revoked successfully", { status: 200 });
  } catch (error) {
    console.error("Error revoking device:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
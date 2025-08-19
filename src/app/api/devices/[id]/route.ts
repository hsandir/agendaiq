import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

// Trust/untrust a device
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const user = authResult.user!;
    const deviceId = params.id;
    const body = await request.json();

    // Verify device belongs to user
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        user_id: parseInt(user.id)
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" }, 
        { status: 404 }
      );
    }

    // Update device trust status
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        is_trusted: body.is_trusted,
        last_active: new Date()
      }
    });

    return NextResponse.json({ 
      device: updatedDevice,
      message: body.is_trusted ? "Device trusted" : "Device untrusted" 
    });

  } catch (error: unknown) {
    console.error('Update Device Error:', error);
    return NextResponse.json(
      { error: "Failed to update device" }, 
      { status: 500 }
    );
  }
}

// Remove a device
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const user = authResult.user!;
    const deviceId = params.id;

    // Verify device belongs to user
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        user_id: parseInt(user.id)
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" }, 
        { status: 404 }
      );
    }

    // Delete device
    await prisma.device.delete({
      where: { id: deviceId }
    });

    return NextResponse.json({ 
      message: "Device removed successfully" 
    });

  } catch (error: unknown) {
    console.error('Delete Device Error:', error);
    return NextResponse.json(
      { error: "Failed to remove device" }, 
      { status: 500 }
    );
  }
}
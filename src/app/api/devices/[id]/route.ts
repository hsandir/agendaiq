import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

// Trust/untrust a devices
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
    const body = await request.json() as Record<string, unknown>;

    // Verify devices belongs to user
    const devices = await prisma.devices.findFirst({
      where: {
        id: parseInt(deviceId),
        user_id: user.id
      }
    });

    if (!devices) {
      return NextResponse.json(
        { error: "Device not found" }, 
        { status: 404 }
      );
    }

    // Update devices trust status
    const updatedDevice = await prisma.devices.update({
      where: { id: parseInt(deviceId) },
      data: {
        is_trusted: Boolean(body.is_trusted),
        last_active: new Date()
      }
    });

    return NextResponse.json({ 
      devices: updatedDevice,
      message: body.is_trusted ? "Device trusted" : "Device untrusted" 
    });

  } catch (error: unknown) {
    console.error('Update Device Error:', error);
    return NextResponse.json(
      { error: "Failed to update devices" }, 
      { status: 500 }
    );
  }
}

// Remove a devices
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

    // Verify devices belongs to user
    const devices = await prisma.devices.findFirst({
      where: {
        id: parseInt(deviceId),
        user_id: user.id
      }
    });

    if (!devices) {
      return NextResponse.json(
        { error: "Device not found" }, 
        { status: 404 }
      );
    }

    // Delete devices
    await prisma.devices.delete({
      where: { id: parseInt(deviceId) }
    });

    return NextResponse.json({ 
      message: "Device removed successfully" 
    });

  } catch (error: unknown) {
    console.error('Delete Device Error:', error);
    return NextResponse.json(
      { error: "Failed to remove devices" }, 
      { status: 500 }
    );
  }
}
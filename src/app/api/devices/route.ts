import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Get all devices for the current user
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const user = authResult.user!;

    const devices = await prisma.device.findMany({
      where: { user_id: parseInt(user.id) },
      orderBy: { last_active: 'desc' }
    });

    return NextResponse.json({ devices });

  } catch (error: unknown) {
    console.error('Get Devices Error:', error);
    return NextResponse.json(
      { error: "Failed to fetch devices" }, 
      { status: 500 }
    );
  }
}

// Register a new device
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const user = authResult.user!;
    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;

    // Get device info from request
    const userAgent = request.headers.get('user-agent') ?? 'Unknown';
    const ipAddress = (request.headers.get('x-forwarded-for') ?? 
                     request.headers.get('x-real-ip')) ?? 'Unknown';

    // Parse user agent for device info
    const deviceInfo = parseUserAgent(userAgent);
    
    // Generate unique device ID
    const deviceId = crypto.randomBytes(32).toString('hex');

    const device = await prisma.device.create({
      data: {
        user_id: parseInt(user.id),
        device_id: deviceId,
        device_name: body.device_name ?? `${deviceInfo.browser} on ${deviceInfo.os}`,
        device_type: deviceInfo.type,
        device_os: deviceInfo.os,
        browser: deviceInfo.browser,
        ip_address: ipAddress,
        is_trusted: false
      }
    });

    return NextResponse.json({ 
      device,
      message: "Device registered successfully" 
    });

  } catch (error: unknown) {
    console.error('Register Device Error:', error);
    return NextResponse.json(
      { error: "Failed to register device" }, 
      { status: 500 }
    );
  }
}

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  let type = 'Desktop';
  let os = 'Unknown';
  let browser = 'Unknown';

  // Detect device type
  if (/mobile/i.test(userAgent)) type = 'Mobile';
  else if (/tablet/i.test(userAgent)) type = 'Tablet';

  // Detect OS
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

  // Detect browser
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/edge/i.test(userAgent)) browser = 'Edge';

  return { type, os, browser };
}
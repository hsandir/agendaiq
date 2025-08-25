import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check system setup status without requiring authentication
    const [districtCount, userCount, adminCount] = await Promise.all([
      prisma.district.count(),
      prisma.users.count(),
      prisma.users.count({ where: { is_system_admin: true } })
    ]);

    const setupStatus = {
      hasDistrict: districtCount > 0,
      hasUsers: userCount > 0,
      hasAdmin: adminCount > 0,
      isSetupComplete: districtCount > 0 && adminCount > 0
    };

    return NextResponse.json(setupStatus);
  } catch (error: unknown) {
    console.error("Error checking setup status:", error);
    return NextResponse.json({
      hasDistrict: false,
      hasUsers: false,
      hasAdmin: false,
      isSetupComplete: false,
      error: 'Failed to check setup status'
    });
  }
} 
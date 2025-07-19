import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { suspiciousAlerts: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Toggle the setting
    await prisma.user.update({
      where: { email: user.email! },
      data: { suspiciousAlerts: !user.suspiciousAlerts },
    });

    return new NextResponse(
      `Suspicious activity alerts ${!user.suspiciousAlerts ? "enabled" : "disabled"}`,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling suspicious activity alerts:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
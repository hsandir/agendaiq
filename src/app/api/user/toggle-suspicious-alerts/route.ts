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

    // TODO: Add suspiciousAlerts field to User model in schema
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      select: { 
        email: true,
        // suspiciousAlerts: true 
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // TODO: Toggle the setting once suspiciousAlerts field is added
    // await prisma.user.update({
    //   where: { email: session.user?.email! },
    //   data: { suspiciousAlerts: !user.suspiciousAlerts },
    // });

    // For now, return error since suspiciousAlerts field doesn't exist
    return new NextResponse("Suspicious alerts feature not available", { status: 501 });
  } catch (error: unknown) {
    console.error("Error toggling suspicious activity alerts:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
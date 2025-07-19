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
      where: { email: session.user.email! },
      select: { loginNotifications: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Toggle the setting
    await prisma.user.update({
      where: { email: session.user.email! },
      data: { loginNotifications: !user.loginNotifications },
    });

    return new NextResponse(
      `Login notifications ${!user.loginNotifications ? "enabled" : "disabled"}`,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling login notifications:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
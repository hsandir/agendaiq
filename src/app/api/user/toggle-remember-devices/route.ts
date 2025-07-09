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

    // Get current user settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { rememberDevices: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Toggle remember devices setting
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { rememberDevices: !user.rememberDevices },
    });

    return new NextResponse(JSON.stringify({
      rememberDevices: updatedUser.rememberDevices,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error toggling remember devices setting:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
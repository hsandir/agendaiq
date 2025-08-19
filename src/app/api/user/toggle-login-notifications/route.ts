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

    // TODO: Add loginNotifications field to User model in schema
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      select: { 
        email: true,
        // loginNotifications: true 
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // TODO: Toggle the setting once loginNotifications field is added
    // await prisma.user.update({
    //   where: { email: session.user?.email! },
    //   data: { loginNotifications: !user?.loginNotifications },
    // });

    // For now, return error since loginNotifications field doesn't exist
    return new NextResponse("Login notifications feature not available", { status: 501 });
  } catch (error: unknown) {
    console.error("Error toggling login notifications:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
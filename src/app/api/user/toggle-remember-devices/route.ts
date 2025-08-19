import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id as string) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // TODO: Add rememberDevices field to User model in schema
    // Get current user settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { 
        id: true,
        // rememberDevices: true 
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // TODO: Toggle remember devices setting once field is added
    // const updatedUser = await prisma.user.update({
    //   where: { id: session.user.id as string },
    //   data: { rememberDevices: !user.rememberDevices },
    // });

    // For now, return error since rememberDevices field doesn't exist
    return new NextResponse("Remember devices feature not available", { status: 501 });
  } catch (error: unknown) {
    console.error("Error toggling remember devices setting:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
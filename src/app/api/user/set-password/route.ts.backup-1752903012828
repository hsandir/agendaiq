import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) {
      return new NextResponse("Passwords do not match", { status: 400 });
    }

    if (newPassword.length < 8) {
      return new NextResponse("Password must be at least 8 characters long", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { hashedPassword: true },
    });

    if (user?.hashedPassword) {
      return new NextResponse("Password already set", { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 12);
    await prisma.user.update({
      where: { email: session.user.email! },
      data: { hashedPassword },
    });

    return new NextResponse("Password set successfully", { status: 200 });
  } catch (error) {
    console.error("Error setting password:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
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

    // Disable 2FA and remove secret
    await prisma.user.update({
      where: { email: user.email! },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return new NextResponse("2FA disabled successfully", { status: 200 });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
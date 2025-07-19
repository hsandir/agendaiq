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

    // Delete all sessions for the user
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return new NextResponse("All sessions revoked successfully", { status: 200 });
  } catch (error) {
    console.error("Error revoking sessions:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
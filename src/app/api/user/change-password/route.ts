import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return new NextResponse("Unauthorized", { status: auth.statusCode || 401 });
    }

    const data = await request.json();
    const { currentPassword, newPassword, confirmPassword } = data;

    if ((newPassword as string) !== (confirmPassword as string)) {
      return new NextResponse("Passwords do not match", { status: 400 });
    }

    if ((newPassword as string).length < 8) {
      return new NextResponse("Password must be at least 8 characters long", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.user.email! },
      select: { hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      return new NextResponse("No password set", { status: 400 });
    }

    const isValid = await compare(currentPassword as string, user?.hashedPassword);
    if (!isValid) {
      return new NextResponse("Current password is incorrect", { status: 400 });
    }

    const hashedPassword = await hash(newPassword as string, 12);
    await prisma.user.update({
      where: { email: auth.user.email! },
      data: { hashedPassword },
    });

    return new NextResponse("Password updated successfully", { status: 200 });
  } catch (error: unknown) {
    console.error("Error changing password:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 
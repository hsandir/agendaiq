import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return NextResponse.json(false, { status: auth.statusCode || 401 });
    }

    // Check if any district exists
    const district = await prisma.district.findFirst();
    return NextResponse.json(!!district);
  } catch (error: unknown) {
    console.error("Error checking district setup:", error);
    return NextResponse.json(false);
  }
} 
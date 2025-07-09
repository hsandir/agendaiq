import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(false);
    }

    // Check if any district exists
    const district = await prisma.district.findFirst();
    return NextResponse.json(!!district);
  } catch (error) {
    console.error("Error checking district setup:", error);
    return NextResponse.json(false);
  }
} 
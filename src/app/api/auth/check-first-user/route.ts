import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json(userCount === 0);
  } catch (error) {
    console.error("Error checking first user:", error);
    return NextResponse.json({ error: "Failed to check first user status" }, { status: 500 });
  }
} 
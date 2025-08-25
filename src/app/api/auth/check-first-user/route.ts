import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Try to connect to database
    const userCount = await prisma.users.count();
    
    // Return false (users exist) instead of error to prevent create account page
    return NextResponse.json(userCount === 0);
  } catch (error: unknown) {
    console.error("Error checking first user - assuming users exist:", error);
    
    // IMPORTANT: Return false on error to prevent showing create account page
    // This prevents the app from showing create account when DB is unavailable
    return NextResponse.json(false)
  }
} 
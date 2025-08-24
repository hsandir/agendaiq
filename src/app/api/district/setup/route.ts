import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_UPDATE });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;
    const { _name, _address } = body;

    if (!name) {
      return NextResponse.json(
        { error: "District name is required" },
        { status: 400 }
      );
    }

    // Check if district already exists
    const existingDistrict = await prisma.district.findFirst({
      where: { name: String(name).trim() },
    });

    if (existingDistrict) {
      return NextResponse.json(
        { error: "District already exists" },
        { status: 409 }
      );
    }

    // Create district
    const district = await prisma.district.create({
      data: {
        name: String(name).trim(),
        address: address?.trim(),
      },
    });

    return NextResponse.json(district);
  } catch (error: unknown) {
    console.error("Error creating district:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
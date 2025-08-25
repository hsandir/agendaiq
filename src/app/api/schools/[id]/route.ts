import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

// PUT /api/schools/:id - Update a school
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { _id } = await params;
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.SCHOOL_MANAGE });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json() as Record<string, unknown>;
    const { name, address, city, state, zipCode, phone, website, logo } = body as { name?: string; address?: string; city?: string; state?: string; zipCode?: string; phone?: string; website?: string; logo?: string };

    if (!name || typeof name !== "string" || String(name).trim().length === 0) {
      return new NextResponse("School name is required", { status: 400 });
    }

    const school = await prisma.school.update({
      where: { id: parseInt(id) },
      data: {
        name: String(name).trim(),
        address: address?.trim(),
        // TODO: Add these fields to School model in schema
        // city: city?.trim(),
        // state: state?.trim(),
        // zipCode: zipCode?.trim(),
        // phone: phone?.trim(),
        // website: website?.trim(),
        // logo: logo?.trim(),
      },
    });

    return new NextResponse(JSON.stringify(school), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in PUT /api/schools:", error);
    if (error instanceof Prisma?.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new NextResponse("School with this name already exists", {
          status: 409,
        });
      }
      if (error.code === "P2025") {
        return new NextResponse("School not found", { status: 404 });
      }
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/schools/:id - Delete a school
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { _id } = await params;
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.SCHOOL_MANAGE });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    await prisma.school.delete({
      where: { id: parseInt(id) },
    });

    return new NextResponse("School deleted successfully", { status: 200 });
  } catch (error: unknown) {
    console.error("Error in DELETE /api/schools:", error);
    if (error instanceof Prisma?.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse("School not found", { status: 404 });
      }
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
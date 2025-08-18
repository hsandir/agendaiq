import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { Prisma } from "@prisma/client";

// PUT /api/schools/:id - Update a school
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { __id  } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { Role: true } } },
    });

    if (user?.Staff?.[0]?.Role?.title !== "Administrator") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { __name, __address, ___city, ___state, ___zipCode, ___phone, ___website, __logo  } = body;

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { __id  } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { Role: true } } },
    });

    if (user?.Staff?.[0]?.Role?.title !== "Administrator") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.school.delete({
      where: { id: parseInt(id) },
    });

    return new NextResponse("School deleted successfully", { status: 200 });
  } catch (error: unknown) {
    console.error("Error in DELETE /api/schools:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse("School not found", { status: 404 });
      }
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
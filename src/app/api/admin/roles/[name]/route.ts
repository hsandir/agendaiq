import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { staff: { include: { role: true } } },
    });

    if (!user || user.staff?.[0]?.role?.title !== 'Administrator') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roleName = decodeURIComponent(params.name);

    // Find and delete the role
    const role = await prisma.role.findFirst({
      where: { title: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Delete the role
    await prisma.role.delete({
      where: { id: role.id },
    });

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
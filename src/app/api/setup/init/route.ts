import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { staff: { include: { role: true } } },
    });

    if (!user || user.staff?.[0]?.role?.title !== 'Administrator') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Initialize system data
    // This would typically initialize default districts, schools, departments, etc.
    
    return NextResponse.json({ message: "System initialized successfully" });
  } catch (error) {
    console.error("Error initializing system:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
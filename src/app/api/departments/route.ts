import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/departments - List all departments
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get the user to check if they're admin - use email instead of id
    const user = await prisma.user.findUnique({
      where: { email: user.email },
      include: { Staff: { include: { Role: true } } }
    });
    if (!user || !user.Staff?.[0] || user.Staff[0].Role?.title !== "Administrator") {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        School: true,
        Role: true
      }
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
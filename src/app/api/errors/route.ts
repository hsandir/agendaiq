import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/errors - Get all errors
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { Role: true } } },
    });

    if (!user || user.Staff?.[0]?.Role?.title !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return empty array since SystemError model doesn't exist
    return NextResponse.json([]);
  } catch (error: unknown) {
    console.error('Error fetching errors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/errors - Create a new error
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id as string) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { Staff: { include: { Role: true } } },
    });

    if (!user || user.Staff?.[0]?.Role?.title !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Log error to console since SystemError model doesn't exist
    console.error('System error reported:', body);

    return NextResponse.json({ message: 'Error logged' });
  } catch (error: unknown) {
    console.error('Error logging system error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
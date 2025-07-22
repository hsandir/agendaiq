import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/departments - List all departments
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireStaff: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

/**
 * GET /api/staff
 * Get all staff members in the organization
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_VIEW 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;

    // Get user's organization context
    const currentStaff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!currentStaff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Fetch all staff from the same organization
    const staff = await prisma.staff.findMany({
      where: {
        OR: [
          { school_id: currentStaff.school_id },
          { district_id: currentStaff.district_id }
        ],
        is_active: true
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        role: {
          select: {
            id: true,
            title: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { users: { name: 'asc' } },
        { users: { email: 'asc' } }
      ]
    });

    return NextResponse.json({
      staff,
      total: staff.length
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Find all users who have admin role
    const adminUsers = await prisma.user.findMany({
      where: {
        Staff: {
          some: {
            Role: {
              title: 'Administrator'
            }
          }
        }
      },
      select: {
        email: true,
        name: true,
        Staff: {
          select: {
            Role: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    // Filter to only include users with Administrator role
    const filteredAdminUsers = adminUsers.filter(user => 
      user.Staff.some(staff => staff.Role?.title === 'Administrator')
    );

    return NextResponse.json({
      adminUsers: filteredAdminUsers.map(user => ({
        email: user.email,
        name: user.name
      }))
    });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
} 
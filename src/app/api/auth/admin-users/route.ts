import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Check if this is first-time setup (no users exist yet)
  try {
    const userCount = await prisma.user.count();
    const isFirstTimeSetup = userCount === 0;
    
    if (!isFirstTimeSetup) {
      // Normal auth required if users already exist - operations admin for user management
      const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
      }
    }
  } catch (error: unknown) {
    console.error('Error checking user count:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  try {
    const userCount = await prisma.user.count();
    const isFirstTimeSetup = userCount === 0;
    
    if (isFirstTimeSetup) {
      // First-time setup: return potential admin users from seed data
      const potentialAdmins = [
        { email: 'admin@school.edu', name: 'School Administrator' },
        { email: 'sysadmin@cjcollegeprep.org', name: 'System Administrator' },
        { email: 'nsercan@cjcollegeprep.org', name: 'Dr. Namik Sercan (CEO)' }
      ];
      
      return NextResponse.json({
        adminUsers: potentialAdmins,
        isFirstTimeSetup: true
      });
    }

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
    const filteredAdminUsers = adminUsers.filteruser => 
      ((user as Record<string, unknown>).Staff.some(staff => staff.Role?.title === 'Administrator')
    );

    return NextResponse.json({
      adminUsers: filteredAdminUsers.map(user => ({
        email: user.email,
        name: user.name
      })),
      isFirstTimeSetup: false
    });

  } catch (error: unknown) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
} 
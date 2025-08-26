import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Look up the user
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        hashed_password: true,
        two_factor_enabled: true,
        is_system_admin: true,
        is_school_admin: true,
        staff: {
          select: {
            id: true,
            role: {
              select: {
                key: true,
                category: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: `User ${email} not found in database`
      });
    }

    // Test password hash if it's the admin user
    let passwordTest = null;
    if (email === 'admin@school.edu' && user.hashed_password) {
      try {
        const testPassword = '1234';
        passwordTest = await bcrypt.compare(testPassword, user.hashed_password);
      } catch (error) {
        passwordTest = `Error testing password: ${error}`;
      }
    }

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.hashed_password,
        passwordLength: user.hashed_password?.length || 0,
        twoFactorEnabled: user.two_factor_enabled,
        isSystemAdmin: user.is_system_admin,
        isSchoolAdmin: user.is_school_admin,
        hasStaff: user.staff.length > 0,
        staffRole: user.staff[0]?.role?.key || null,
        passwordTest: passwordTest
      }
    });
  } catch (error) {
    console.error('User check error:', error);
    return NextResponse.json({
      error: 'Database error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
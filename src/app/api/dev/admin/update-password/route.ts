import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and newPassword are required' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, is_system_admin: true, is_school_admin: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password
    await prisma.users.update({
      where: { id: user.id },
      data: { hashed_password: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: `Password updated for ${email}`,
      userInfo: {
        email: user.email,
        isSystemAdmin: user.is_system_admin,
        isSchoolAdmin: user.is_school_admin
      }
    });
  } catch (error: unknown) {
    console.error('Failed to update admin password:', error);
    return NextResponse.json(
      { error: 'Failed to update password', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Also allow GET to list admin users
export async function GET() {
  try {
    const adminUsers = await prisma.users.findMany({
      where: {
        OR: [
          { is_system_admin: true },
          { is_school_admin: true }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        is_system_admin: true,
        is_school_admin: true,
        created_at: true,
        staff: {
          select: {
            id: true,
            role: {
              select: { key: true, name: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      adminUsers,
      count: adminUsers.length
    });
  } catch (error: unknown) {
    console.error('Failed to fetch admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}
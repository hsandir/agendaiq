import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Temporary endpoint for debugging - no auth required
export async function POST(request: NextRequest) {
  try {
    // Development endpoint - no auth required in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }
    
    const { email, password } = await request.json();
    
    console.log('Test login attempt for:', email);
    
    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        hashed_password: true,
        email_verified: true,
        staff: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        email 
      }, { status: 404 });
    }
    
    if (!(user as Record<string, unknown>).hashed_password) {
      return NextResponse.json({ 
        error: 'User has no password',
        email,
        userId: user.id 
      }, { status: 400 });
    }
    
    // Test password
    const isValid = await bcrypt.compare(password as string, user.hashed_password as string);
    
    return NextResponse.json({
      success: isValid,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.hashed_password,
        email_verified: !!user.email_verified,
        role: user.staff?.[0]?.role?.title
      },
      passwordCheck: {
        providedPassword: password,
        hashExists: !!user.hashed_password,
        hashStartsWith: user.hashed_password?.substring(0, 10),
        isValid
      }
    });
    
  } catch (error: unknown) {
    console.error('Test login error:', error);
    return NextResponse.json({ 
      error: 'Internal error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
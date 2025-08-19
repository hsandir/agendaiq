import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Temporary endpoint for debugging - no auth required
export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as Record<string, unknown>;
    
    console.log('Test login attempt for:', email);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        hashedPassword: true,
        emailVerified: true,
        Staff: {
          include: {
            Role: true
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
    
    if (!user.hashedPassword) {
      return NextResponse.json({ 
        error: 'User has no password',
        email,
        userId: user.id 
      }, { status: 400 });
    }
    
    // Test password
    const isValid = await bcrypt.compare(password as string, user.hashedPassword);
    
    return NextResponse.json({
      success: isValid,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.hashedPassword,
        emailVerified: !!user.emailVerified,
        role: user.Staff?.[0]?.Role?.title
      },
      passwordCheck: {
        providedPassword: password,
        hashExists: !!user.hashedPassword,
        hashStartsWith: user.hashedPassword?.substring(0, 10),
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
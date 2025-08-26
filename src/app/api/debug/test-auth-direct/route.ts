import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Direct authentication test bypassing NextAuth form
export async function POST(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    test: 'Direct Authentication Test',
    steps: [] as any[]
  };

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 DIRECT AUTH TEST:', email);

    // Step 1: Database user lookup
    try {
      const user = await prisma.users.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          hashed_password: true,
          is_system_admin: true,
          is_school_admin: true
        }
      });

      if (!user) {
        results.steps.push({
          step: 'User Lookup',
          status: 'FAILED',
          error: 'User not found'
        });
        return NextResponse.json(results);
      }

      results.steps.push({
        step: 'User Lookup', 
        status: 'SUCCESS',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          hasPassword: !!user.hashed_password,
          passwordLength: user.hashed_password?.length
        }
      });

      // Step 2: Password verification
      if (!user.hashed_password) {
        results.steps.push({
          step: 'Password Check',
          status: 'FAILED',
          error: 'No hashed password stored'
        });
        return NextResponse.json(results);
      }

      const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

      results.steps.push({
        step: 'Password Verification',
        status: isPasswordValid ? 'SUCCESS' : 'FAILED',
        provided_password_length: password?.length,
        hash_comparison: isPasswordValid
      });

      if (!isPasswordValid) {
        return NextResponse.json(results);
      }

      // Step 3: NextAuth environment check
      results.steps.push({
        step: 'NextAuth Environment',
        status: 'INFO',
        nextauth_url: process.env.NEXTAUTH_URL,
        nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET
      });

      // Success!
      results.steps.push({
        step: 'Authentication Complete',
        status: 'SUCCESS',
        message: 'All authentication steps passed',
        user_data: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_system_admin: user.is_system_admin,
          is_school_admin: user.is_school_admin
        }
      });

    } catch (error: any) {
      results.steps.push({
        step: 'Database Error',
        status: 'FAILED',
        error: error.message
      });
    }

  } catch (error: any) {
    results.steps.push({
      step: 'Request Processing',
      status: 'FAILED', 
      error: error.message
    });
  }

  console.log('🔐 DIRECT AUTH TEST RESULTS:', JSON.stringify(results, null, 2));
  return NextResponse.json(results);
}
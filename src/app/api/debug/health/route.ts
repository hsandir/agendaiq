import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET() {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      database: 'unknown',
      auth: 'unknown',
      environment: process.env.NODE_ENV,
      errors: [] as string[]
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'failed';
      health.errors.push(`Database: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check authentication system
    try {
      const session = await getServerSession(authOptions);
      health.auth = session ? 'authenticated' : 'no-session';
    } catch (error) {
      health.auth = 'failed';
      health.errors.push(`Auth: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check environment variables
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      health.errors.push(`Missing env vars: ${missingVars.join(', ')}`);
    }

    health.status = health.errors.length === 0 ? 'healthy' : 'unhealthy';

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
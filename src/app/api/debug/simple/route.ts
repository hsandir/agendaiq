import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test database connection
    const { prisma } = await import('@/lib/prisma');
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Test auth system
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth/auth-options');
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'ok',
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      database: dbTest ? 'connected' : 'failed',
      session: session ? 'authenticated' : 'no-session',
      envVars: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      },
      message: 'Debug endpoint working with full tests'
    });
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      message: 'Debug endpoint caught an error'
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public debug endpoint to check auth state
export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      connected: false,
      userCount: 0,
      adminCount: 0,
      error: null as string | null
    },
    auth: {
      nextAuthConfigured: false,
      secretSet: false,
      urlSet: false
    },
    firstUserCheck: {
      result: null as boolean | null,
      error: null as string | null
    }
  };

  try {
    // 1. Test database connection
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { is_admin: true } });
    
    debugInfo.database.connected = true;
    debugInfo.database.userCount = userCount;
    debugInfo.database.adminCount = adminCount;
    
    // First user check logic
    debugInfo.firstUserCheck.result = userCount === 0;
    
  } catch (error) {
    debugInfo.database.error = error instanceof Error ? error.message : 'Unknown error';
    debugInfo.database.connected = false;
    
    // IMPORTANT: Return false when database fails to prevent create account page
    debugInfo.firstUserCheck.result = false;
    debugInfo.firstUserCheck.error = 'Database error - assuming users exist';
  }

  // 2. Check NextAuth configuration
  debugInfo.auth.secretSet = !!process.env.NEXTAUTH_SECRET;
  debugInfo.auth.urlSet = !!process.env.NEXTAUTH_URL;
  debugInfo.auth.nextAuthConfigured = debugInfo.auth.secretSet && debugInfo.auth.urlSet;

  // 3. Add recommendations
  const issues = [];
  
  if (!debugInfo.database.connected) {
    issues.push({
      type: 'CRITICAL',
      message: 'Database not connected',
      fix: 'Check DATABASE_URL in Vercel environment variables'
    });
  }
  
  if (debugInfo.database.userCount > 0 && debugInfo.firstUserCheck.result === true) {
    issues.push({
      type: 'CRITICAL',
      message: 'First user check returning wrong value',
      fix: 'Database has users but API returns true (no users)'
    });
  }
  
  if (!debugInfo.auth.nextAuthConfigured) {
    issues.push({
      type: 'HIGH',
      message: 'NextAuth not fully configured',
      fix: 'Set NEXTAUTH_SECRET and NEXTAUTH_URL in Vercel'
    });
  }

  return NextResponse.json({
    ...debugInfo,
    issues,
    recommendation: issues.length > 0 
      ? 'Fix critical issues in Vercel environment variables'
      : 'System configured correctly'
  });
}
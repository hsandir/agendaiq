import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireStaffRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Get test coverage from recent test runs
    const latestTestRun = await prisma.auditLog.findFirst({
      where: {
        tableName: 'test_run',
        operation: 'CREATE'
      },
      orderBy: { createdAt: 'desc' },
      select: { changes: true }
    });
    
    const testCoverage = (latestTestRun?.changes as any)?.coverage || 0;
    
    // Get previous coverage for comparison
    const previousTestRun = await prisma.auditLog.findFirst({
      where: {
        tableName: 'test_run',
        operation: 'CREATE',
        createdAt: {
          lt: latestTestRun?.createdAt || new Date()
        }
      },
      orderBy: { createdAt: 'desc' },
      select: { changes: true }
    });
    
    const previousCoverage = (previousTestRun?.changes as any)?.coverage || 0;
    const coverageChange = testCoverage - previousCoverage;
    
    // Check build status (simulated for now)
    const buildStatus = 'passing';
    const buildTime = latestTestRun ? 
      ((latestTestRun.changes as any)?.duration || 0) : 
      0;
    
    // Check API health by counting recent errors
    const recentErrors = await prisma.auditLog.count({
      where: {
        operation: 'ERROR',
        createdAt: {
          gte: new Date(Date.now() - 3600000) // Last hour
        }
      }
    });
    
    const apiHealth = recentErrors === 0 ? 'operational' : 
                     recentErrors < 5 ? 'degraded' : 'down';
    
    // Count active errors (recent errors that haven't been resolved)
    const activeErrors = await prisma.auditLog.count({
      where: {
        operation: 'ERROR',
        createdAt: {
          gte: new Date(Date.now() - 86400000) // Last 24 hours
        }
      }
    });

    return NextResponse.json({
      testCoverage: {
        value: testCoverage,
        change: coverageChange,
        formatted: `${testCoverage}%`,
        changeFormatted: coverageChange >= 0 ? `+${coverageChange.toFixed(1)}%` : `${coverageChange.toFixed(1)}%`
      },
      buildStatus: {
        status: buildStatus,
        time: buildTime,
        timeFormatted: buildTime > 0 ? 
          `${Math.floor(buildTime / 60)}m ${buildTime % 60}s` : 
          'N/A'
      },
      apiHealth: {
        status: apiHealth,
        message: apiHealth === 'operational' ? 'All systems operational' :
                apiHealth === 'degraded' ? 'Minor issues detected' :
                'Major outage'
      },
      activeErrors: {
        count: activeErrors,
        requiresAttention: activeErrors > 0
      }
    });
  } catch (error) {
    console.error('Failed to fetch dev stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch development statistics' },
      { status: 500 }
    );
  }
}
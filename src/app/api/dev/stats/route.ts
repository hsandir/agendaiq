import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { can, Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;

  // Check development capability
  if (!can(user, Capability.DEV_DEBUG)) {
    return NextResponse.json({ error: 'Development access required' }, { status: 403 });
  }

  try {
    // Get test coverage from recent test runs
    const latestTestRun = await prisma.auditLog.findFirst({
      where: {
        table_name: 'test_run',
        operation: 'CREATE'
      },
      orderBy: { created_at: 'desc' },
      select: { 
        field_changes: true,
        created_at: true
      }
    });
    
    const testCoverage = (latestTestRun?.field_changes as any)?.coverage || 0;
    
    // Get previous coverage for comparison
    const previousTestRun = await prisma.auditLog.findFirst({
      where: {
        table_name: 'test_run',
        operation: 'CREATE',
        created_at: {
          lt: latestTestRun?.created_at || new Date()
        }
      },
      orderBy: { created_at: 'desc' },
      select: { 
        field_changes: true,
        created_at: true
      }
    });
    
    const previousCoverage = (previousTestRun?.field_changes as any)?.coverage || 0;
    const coverageChange = testCoverage - previousCoverage;
    
    // Check build status (simulated for now)
    const buildStatus = 'passing';
    const buildTime = latestTestRun ? 
      ((latestTestRun.field_changes as any)?.duration || 0) : 
      0;
    
    // Check API health by counting recent errors
    const recentErrors = await prisma.auditLog.count({
      where: {
        operation: 'ERROR',
        created_at: {
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
        created_at: {
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
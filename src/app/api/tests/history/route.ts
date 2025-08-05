import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireStaffRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Get test history from audit logs or create a test_runs table in future
    // For now, we'll use audit logs to track test runs
    const testLogs = await prisma.auditLog.findMany({
      where: {
        tableName: 'test_run',
        operation: 'CREATE'
      },
      orderBy: { createdAt: 'desc' },
      take: 30, // Last 30 test runs
      select: {
        createdAt: true,
        changes: true
      }
    });

    // Transform logs to test history format
    const history = testLogs.map(log => {
      const changes = log.changes as any || {};
      return {
        date: log.createdAt.toISOString().split('T')[0],
        passed: changes.passed || 0,
        failed: changes.failed || 0,
        coverage: changes.coverage || 0,
        duration: changes.duration || 0
      };
    });

    // If no history exists, return empty array
    if (history.length === 0) {
      return NextResponse.json({ history: [] });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Failed to fetch test history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireStaffRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const body = await request.json();
    const { passed, failed, coverage, duration } = body;

    // Log test run in audit log
    await prisma.auditLog.create({
      data: {
        tableName: 'test_run',
        recordId: Date.now().toString(),
        operation: 'CREATE',
        userId: authResult.user.id,
        staffId: authResult.user.staff?.id,
        changes: {
          passed,
          failed,
          coverage,
          duration
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        description: `Test run completed: ${passed} passed, ${failed} failed`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save test history:', error);
    return NextResponse.json(
      { error: 'Failed to save test history' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Get test history from audit logs or create a test_runs table in future
    // For now, we'll use audit logs to track test runs
    const testLogs = await prisma.audit_logs.findMany({
      where: {
        table_name: 'test_run',
        operation: 'CREATE'
      },
      orderBy: { created_at: 'desc' },
      take: 30, // Last 30 test runs
      select: {
        created_at: true,
        field_changes: true
      }
    });

    // Transform logs to test history format
    const history = testLogs.map(log => {
      const changes = log.field_changes as Record<string, unknown> || {};
      return {
        date: log.created_at.toISOString().split('T')[0],
        passed: changes.passed ?? 0,
        failed: changes.failed ?? 0,
        coverage: changes.coverage ?? 0,
        duration: changes.duration ?? 0
      };
    });

    return NextResponse.json({ history });
  } catch (error: unknown) {
    console.error('Failed to fetch test history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;

  try {
    const body = await request.json() as Record<string, unknown>;
    const { __passed, __failed, __coverage, __duration  } = body;

    // Log test run in audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'test_run',
        record_id: Date.now().toString(),
        operation: 'CREATE',
        source: 'SYSTEM',
        user_id: parseInt(user.id),
        staff_id: (user.staff as Record<string, unknown> | null)?.id,
        field_changes: {
          passed,
          failed,
          coverage,
          duration
        },
        ip_address: request.headers.get('x-forwarded-for') ?? 'unknown',
        user_agent: request.headers.get('user-agent') ?? 'unknown',
        description: `Test run completed: ${passed} passed, ${failed} failed`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to save test history:', error);
    return NextResponse.json(
      { error: 'Failed to save test history' },
      { status: 500 }
    );
  }
}
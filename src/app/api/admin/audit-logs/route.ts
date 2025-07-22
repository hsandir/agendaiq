import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { AuditLogger } from '@/lib/audit/audit-logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAdminRole: true });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const tableName = searchParams.get('table');
    const operation = searchParams.get('operation');
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;
    const staffId = searchParams.get('staffId') ? parseInt(searchParams.get('staffId')!) : undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const filters = {
      tableName: tableName || undefined,
      operation: operation || undefined,
      userId,
      staffId,
      startDate,
      endDate,
      limit,
      offset
    };

    const auditLogs = await AuditLogger.getAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: auditLogs,
      pagination: {
        limit,
        offset,
        hasMore: auditLogs.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({
      error: 'Failed to fetch audit log records',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
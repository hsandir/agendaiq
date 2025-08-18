import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { auditSystem } from '@/lib/audit/hybrid-audit-system';
import { AuditCategory } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireCapability: Capability.USER_MANAGE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { __searchParams  } = new URL(request.url);
    
    // Parse query parameters for hybrid system
    const logType = searchParams.get('type') || 'critical'; // 'critical' | 'legacy' | 'both'
    const category = searchParams.get('category') as AuditCategory | null;
    // Additional parameters for future filtering capability
    // const action = searchParams.get('action');
    // const search = searchParams.get('search');
    // const ipAddress = searchParams.get('ipAddress');
    // const minRiskScore = searchParams.get('minRiskScore');
    // const successOnly = searchParams.get('success');
    
    // Parse pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    
    // Parse and validate user/staff IDs
    const userIdParam = searchParams.get('userId');
    const userId = userIdParam ? Number(userIdParam) : undefined;
    if (userIdParam && Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const staffIdParam = searchParams.get('staffId');
    const staffId = staffIdParam ? Number(staffIdParam) : undefined;
    if (staffIdParam && Number.isNaN(staffId)) {
      return NextResponse.json({ error: 'Invalid staffId' }, { status: 400 });
    }

    // Parse and validate dates
    const startDateParam = searchParams.get('startDate');
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    if (startDate && Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid startDate' }, { status: 400 });
    }

    const endDateParam = searchParams.get('endDate');
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    if (endDate && Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid endDate' }, { status: 400 });
    }

    let response;

    if (logType === 'critical') {
      // Get critical audit logs from hybrid system
      const criticalLogs = await auditSystem.getRecentCriticalEvents(limit, category || undefined, userId);
      
      response = {
        success: true,
        data: criticalLogs,
        type: 'critical',
        pagination: {
          page,
          limit,
          total: criticalLogs.length,
          hasMore: criticalLogs.length === limit
        }
      };

    } else if (logType === 'legacy') {
      // Get legacy audit logs (backward compatibility)
      const tableName = searchParams.get('table');
      const operation = searchParams.get('operation');
      const offset = (page - 1) * limit;

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

      const legacyLogs = await AuditLogger.getAuditLogs(filters);
      
      response = {
        success: true,
        data: legacyLogs,
        type: 'legacy',
        pagination: {
          page,
          limit,
          offset,
          hasMore: legacyLogs.length === limit
        }
      };

    } else {
      // Get both types (default for admin dashboard)
      const [criticalLogs, legacyLogs] = await Promise.all([
        auditSystem.getRecentCriticalEvents(Math.floor(limit / 2), category || undefined, userId),
        AuditLogger.getAuditLogs({
          userId,
          staffId,
          startDate,
          endDate,
          limit: Math.floor(limit / 2),
          offset: 0
        })
      ]);

      response = {
        success: true,
        data: {
          critical: criticalLogs,
          legacy: legacyLogs
        },
        type: 'both',
        pagination: {
          page,
          limit,
          total: criticalLogs.length + legacyLogs.length,
          hasMore: criticalLogs.length + legacyLogs.length === limit
        }
      };
    }

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({
      error: 'Failed to fetch audit log records',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { auditSystem } from '@/lib/audit/hybrid-audit-system';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { AuditCategory } from '@prisma/client';

// Safe type definitions for audit log records
interface BaseAuditRecord {
  timestamp?: string;
  created_at?: string;
  source?: string;
  category?: string;
  table_name?: string;
  action?: string;
  operation?: string;
  User?: { email?: string };
  Staff?: { Role?: { title?: string } };
  ip_address?: string;
  risk_score?: number;
  success?: boolean;
  error_message?: string;
  description?: string;
}

// Type for sortable audit records
interface SortableAuditRecord extends BaseAuditRecord {
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireAdminRole: true });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const format = searchParams.get('format') || 'csv'; // 'csv' | 'json'
    const logType = searchParams.get('type') || 'critical'; // 'critical' | 'legacy' | 'both'
    const category = searchParams.get('category') as AuditCategory | null;
    const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined;
    const staffId = searchParams.get('staffId') ? Number(searchParams.get('staffId')) : undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const maxRecords = Math.min(10000, parseInt(searchParams.get('maxRecords') || '1000'));

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv or json' }, { status: 400 });
    }

    let data: SortableAuditRecord[] = [];

    if (logType === 'critical' || logType === 'both') {
      const criticalLogs = await auditSystem.getRecentCriticalEvents(maxRecords, category || undefined, userId);
      
      if (logType === 'critical') {
        data = criticalLogs;
      } else {
        data.push(...criticalLogs.map(log => ({ ...log, source: 'critical' })));
      }
    }

    if (logType === 'legacy' || logType === 'both') {
      const legacyLogs = await AuditLogger.getAuditLogs({
        userId,
        staffId,
        startDate,
        endDate,
        limit: logType === 'legacy' ? maxRecords : Math.floor(maxRecords / 2),
        offset: 0
      });

      if (logType === 'legacy') {
        data = legacyLogs;
      } else {
        data.push(...legacyLogs.map(log => ({ ...log, source: 'legacy' })));
      }
    }

    // Sort by timestamp descending  
    data.sort((a: SortableAuditRecord, b: SortableAuditRecord) => {
      const timeA = new Date(a.timestamp || a.created_at || '').getTime();
      const timeB = new Date(b.timestamp || b.created_at || '').getTime();
      return timeB - timeA;
    });

    // Limit to maxRecords
    data = data.slice(0, maxRecords);

    if (format === 'json') {
      // JSON export
      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else {
      // CSV export with proper escaping
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      
      const headers = [
        'Timestamp',
        'Type',
        'Category/Table',
        'Action/Operation',
        'User Email',
        'Staff Role',
        'IP Address',
        'Risk Score',
        'Success',
        'Error Message',
        'Description'
      ];

      const csvRows = data.map((log: BaseAuditRecord) => {
        const timestamp = new Date(log.timestamp || log.created_at || '').toISOString();
        const type = log.source || (log.category ? 'critical' : 'legacy');
        const categoryOrTable = log.category || log.table_name || '';
        const actionOrOperation = log.action || log.operation || '';
        const userEmail = log.User?.email || '';
        const staffRole = log.Staff?.Role?.title || '';
        const ipAddress = log.ip_address || '';
        const riskScore = log.risk_score?.toString() || '';
        const success = log.success !== undefined ? log.success.toString() : '';
        const errorMessage = log.error_message || '';
        const description = log.description || '';

        return [
          escape(timestamp),
          escape(type),
          escape(categoryOrTable),
          escape(actionOrOperation),
          escape(userEmail),
          escape(staffRole),
          escape(ipAddress),
          escape(riskScore),
          escape(success),
          escape(errorMessage),
          escape(description)
        ].join(',');
      });

      const csvContent = [
        headers.map(escape).join(','),
        ...csvRows
      ].join('\n');

      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

  } catch (error) {
    console.error('Export audit logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auditSystem } from '@/lib/audit/hybrid-audit-system';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

/**
 * Internal API endpoint for processing audit events from middleware
 * This runs in Node.js runtime and can handle file operations
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_LOGS });
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.statusCode });
    }
    const auditEvent = await request.json() as Record<string, unknown>;
    
    // Extract event data
    const { ___action,
      ___path,
      ___method,
      ___success,
      ___errorMessage,
      ___metadata,
      _category
     } = auditEvent;

    // Determine category and log appropriately
    if (category === 'AUTH') {
      await auditSystem.logAuth(
        action,
        metadata?.userId,
        metadata?.staffId,
        success,
        { request: auditEvent }
      );
    } else if (category === 'SECURITY') {
      await auditSystem.logSecurity(
        action,
        metadata?.userId,
        metadata?.staffId,
        errorMessage,
        { request: auditEvent }
      );
    } else if (path?.startsWith('/api/admin/')) {
      // Critical admin operations
      await auditSystem.logDataCritical(
        action,
        metadata?.userId,
        metadata?.staffId,
        metadata?.targetUserId,
        metadata,
        { request: auditEvent }
      );
    } else if (path?.startsWith('/dashboard')) {
      // Page visits
      await auditSystem.logPageVisit(
        path,
        metadata?.userId,
        metadata?.staffId,
        metadata?.duration ?? 0,
        { request: auditEvent }
      );
    } else {
      // General API calls
      await auditSystem.logApiCall(
        path ?? action,
        method ?? 'GET',
        metadata?.duration ?? 0,
        metadata?.userId,
        metadata?.staffId,
        { request: auditEvent }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Internal audit API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process audit event' 
    }, { status: 500 });
  }
}
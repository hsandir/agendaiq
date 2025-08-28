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
    const { 
      action,
      path,
      method,
      success,
      errorMessage,
      metadata,
      category
    } = auditEvent;

    // Determine category and log appropriately
    if (category === 'AUTH') {
      await auditSystem.logAuth(
        String(action ?? 'unknown'),
        (metadata as any)?.userId,
        (metadata as any)?.staffId,
        Boolean(success ?? false),
        auditEvent as any
      );
    } else if (category === 'SECURITY') {
      await auditSystem.logSecurity(
        String(action ?? 'unknown'),
        (metadata as any)?.userId,
        (metadata as any)?.staffId,
        String(errorMessage ?? ''),
        auditEvent as any
      );
    } else if (String(path ?? '').startsWith('/api/admin/')) {
      // Critical admin operations
      await auditSystem.logDataCritical(
        String(action ?? 'unknown'),
        (metadata as any)?.userId,
        (metadata as any)?.staffId,
        (metadata as any)?.targetUserId,
        metadata as any,
        auditEvent as any
      );
    } else if (String(path ?? '').startsWith('/dashboard')) {
      // Page visits
      await auditSystem.logPageVisit(
        String(path ?? 'unknown'),
        (metadata as any)?.userId,
        (metadata as any)?.staffId,
        Number((metadata as any)?.duration ?? 0),
        auditEvent as any
      );
    } else {
      // General API calls
      await auditSystem.logApiCall(
        String(path ?? action ?? 'unknown'),
        String(method ?? 'GET'),
        Number((metadata as any)?.duration ?? 0),
        (metadata as any)?.userId,
        (metadata as any)?.staffId,
        auditEvent as any
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
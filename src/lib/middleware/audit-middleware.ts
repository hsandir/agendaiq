import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { EdgeAuditLogger } from '@/lib/audit/edge-audit-logger';

// Extend NextRequest to support audit event storage
declare module 'next/server' {
  interface NextRequest {
    _auditEvent?: Record<string, unknown>;
  }
}

/**
 * Edge Runtime compatible middleware for audit logging
 * This version doesn't use Node.js modules and instead queues events for API processing
 */
export async function auditMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // Get user context from session
  let userId: number | undefined;
  let staffId: number | undefined;
  
  try {
    const token = await getToken({ req: request });
    if (token?.id) {
      userId = parseInt(token.id); // Convert string id to number
      // Safely access staff property from token
      if (token.staff && typeof token.staff === 'object' && 'id' in token.staff) {
        staffId = typeof token.staff.id === 'number' ? token.staff.id : undefined;
      }
    }
  } catch (error: unknown) {
    // Continue without user context
  }

  // Log request immediately (edge-compatible)
  const duration = Date.now() - startTime;
  EdgeAuditLogger.logRequest(request, duration, 200); // Assume success for now

  // For critical events, prepare audit event for later processing
  if (isCriticalPath(pathname, request.method)) {
    const auditEvent = EdgeAuditLogger.createAuditEvent(
      `${request.method}_${pathname.replace(/\//g, '_')}`,
      request,
      true,
      undefined,
      { userId, staffId, type: 'middleware_critical' }
    );

    // Store audit event in request for later processing
    // This will be handled by the final response in main middleware
    request._auditEvent = auditEvent;
  }

  // Return null to continue middleware chain
  return null;
}

/**
 * Determine if a path should be audited as critical
 */
function isCriticalPath(pathname: string, method: string): boolean {
  // Admin endpoints
  if (pathname.startsWith('/api/admin/')) return true;
  
  // Authentication endpoints  
  if (pathname.includes('/auth/')) return true;
  
  // Dashboard access
  if (pathname.startsWith('/dashboard')) return true;
  
  // User management
  if (pathname.includes('/users') && ['POST', 'PUT', 'DELETE'].includes(method)) return true;
  
  // Staff operations
  if (pathname.includes('/staff') && ['POST', 'PUT', 'DELETE'].includes(method)) return true;
  
  // Role/permission changes
  if (pathname.includes('/roles') && ['POST', 'PUT', 'DELETE'].includes(method)) return true;
  
  return false;
}

/**
 * Edge-compatible auth event creator
 */
export function createAuthEvent(
  action: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change',
  request: NextRequest,
  userId?: number,
  staffId?: number,
  errorMessage?: string
): Record<string, unknown> {
  return EdgeAuditLogger.createAuditEvent(
    `auth_${action}`,
    request,
    !action.includes('failure') && !errorMessage,
    errorMessage,
    { userId, staffId, category: 'AUTH' }
  );
}

/**
 * Edge-compatible security event creator
 */
export function createSecurityEvent(
  action: string,
  request: NextRequest,
  userId?: number,
  staffId?: number,
  errorMessage?: string
): Record<string, unknown> {
  return EdgeAuditLogger.createAuditEvent(
    `security_${action}`,
    request,
    !errorMessage,
    errorMessage,
    { userId, staffId, category: 'SECURITY' }
  );
}
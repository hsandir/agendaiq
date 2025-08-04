import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { EdgeAuditLogger } from '@/lib/audit/edge-audit-logger';

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
      userId = token.id as number;
      staffId = token.staff?.id as number;
    }
  } catch (error) {
    // Continue without user context
  }

  // Proceed with request
  const response = NextResponse.next();
  
  // Log request immediately (edge-compatible)
  const duration = Date.now() - startTime;
  EdgeAuditLogger.logRequest(request, duration, response.status);

  // For critical events, queue them for API processing
  if (isCriticalPath(pathname, request.method)) {
    const auditEvent = EdgeAuditLogger.createAuditEvent(
      `${request.method}_${pathname.replace(/\//g, '_')}`,
      request,
      true,
      undefined,
      { userId, staffId, type: 'middleware_critical' }
    );

    // Add header to trigger API-side audit processing
    response.headers.set('x-audit-event', JSON.stringify(auditEvent));
  }

  return response;
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
): Record<string, any> {
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
): Record<string, any> {
  return EdgeAuditLogger.createAuditEvent(
    `security_${action}`,
    request,
    !errorMessage,
    errorMessage,
    { userId, staffId, category: 'SECURITY' }
  );
}
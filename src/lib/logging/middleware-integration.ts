/**
 * Logging Middleware Integration
 * Automatically logs API requests, responses, and errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { devLogger, auditLogger } from './index';
import { DevLogCategory, AuditLogCategory } from './types';

interface RequestContext {
  userId?: string;
  staffId?: string;
  email?: string;
  role?: string;
  department?: string;
  sessionId?: string;
}

/**
 * Middleware to log API requests and responses
 */
export function withLogging(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    skipPaths?: string[];
    logBody?: boolean;
    logHeaders?: boolean;
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Skip logging for certain paths if specified
    if (options?.skipPaths?.some(skipPath => path.startsWith(skipPath))) {
      return handler(request);
    }

    // Extract context from request
    const context = extractRequestContext(request);
    
    // Create request ID for correlation
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Log API request start
    await devLogger.info(
      DevLogCategory.API,
      `${method} ${path} - Request started`,
      {
        requestId,
        userAgent: request.headers.get('user-agent'),
        ip: getClientIP(request),
        body: options?.logBody ? await getRequestBody(request) : undefined,
        headers: options?.logHeaders ? Object.fromEntries(request.headers.entries()) : undefined
      },
      {
        userId: context.userId,
        staffId: context.staffId,
        sessionId: context.sessionId,
        path,
        method,
        requestId
      }
    );

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the handler
      response = await handler(request);
    } catch (err: unknown) {
      error = err instanceof Error ? err : new Error(String(err));
      
      // Log the error
      await devLogger.error(
        DevLogCategory.API,
        `${method} ${path} - Request failed`,
        error,
        {
          requestId,
          duration: Date.now() - startTime
        },
        {
          userId: context.userId,
          staffId: context.staffId,
          sessionId: context.sessionId,
          path,
          method,
          statusCode: 500,
          duration: Date.now() - startTime,
          requestId
        }
      );

      // Create error response
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    const statusCode = response.status;

    // Log API response
    await devLogger.logApiRequest(
      method,
      path,
      statusCode,
      duration,
      context.userId,
      {
        requestId,
        responseSize: response.headers.get('content-length'),
        contentType: response.headers.get('content-type')
      }
    );

    // Log audit trail for sensitive operations
    if (shouldLogAudit(method, path, statusCode)) {
      await logAuditTrail(method, path, statusCode, context, {
        requestId,
        duration,
        ip: getClientIP(request)
      });
    }

    return response;
  };
}

/**
 * Extract user context from request
 */
function extractRequestContext(request: NextRequest): RequestContext {
  // This would typically extract from session, JWT, or headers
  // For now, we'll try to get it from headers or return empty context
  
  return {
    userId: request.headers.get('x-user-id') || undefined,
    staffId: request.headers.get('x-staff-id') || undefined,
    email: request.headers.get('x-user-email') || undefined,
    role: request.headers.get('x-user-role') || undefined,
    department: request.headers.get('x-user-department') || undefined,
    sessionId: request.headers.get('x-session-id') || undefined
  };
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ?? 'unknown'
}

/**
 * Get request body safely
 */
async function getRequestBody(request: NextRequest): Promise<any> {
  try {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await request.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Determine if audit logging is needed
 */
function shouldLogAudit(method: string, path: string, statusCode: number): boolean {
  // Log audit for all authentication endpoints
  if (path.startsWith('/api/auth/')) return true;
  
  // Log audit for admin endpoints
  if (path.startsWith('/api/admin/')) return true;
  
  // Log audit for user management
  if (path.startsWith('/api/user/') && ['POST', 'PUT', 'DELETE'].includes(method)) return true;
  
  // Log audit for data modifications
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && statusCode < 400) return true;
  
  // Log audit for failed requests (potential security issues)
  if (statusCode >= 401 && statusCode <= 403) return true;
  
  return false;
}

/**
 * Log audit trail
 */
async function logAuditTrail(
  method: string,
  path: string,
  statusCode: number,
  context: RequestContext,
  metadata: Record<string, unknown>
) {
  if (!context.userId || !context.email) {
    // Can't audit without user context
    return;
  }

  const actor = {
    userId: context.userId,
    staffId: context.staffId,
    email: context.email,
    role: context.role,
    department: context.department
  };

  const result = statusCode < 400 ? 'success' : 
                 statusCode === 401 ?? statusCode === 403 ? 'blocked' : 'failure';

  // Determine audit category based on path
  let category = AuditLogCategory.USER_ACTION;
  let action = `${method.toLowerCase()}_${path.split('/').pop() ?? 'endpoint'}`;

  if (path.startsWith('/api/auth/')) {
    category = AuditLogCategory.LOGIN_ATTEMPT;
    action = path.includes('signin') ? 'login' : 
             path.includes('signup') ? 'register' : 
             path.includes('logout') ? 'logout' : action;
  } else if (path.startsWith('/api/admin/')) {
    category = AuditLogCategory.ADMIN_ACTION;
  } else if (method === 'GET') {
    category = AuditLogCategory.DATA_ACCESS;
    action = 'read_data';
  } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    category = AuditLogCategory.DATA_MODIFICATION;
    action = method === 'POST' ? 'create_data' :
             method === 'PUT' || method === 'PATCH' ? 'update_data' :
             'delete_data';
  }

  // Log the audit event
  await auditLogger.logUserAction(
    actor,
    action,
    result,
    {
      metadata: {
        ...metadata,
        endpoint: path,
        method,
        statusCode
      },
      context: {
        ip: metadata.ip,
        path,
        method,
        statusCode,
        duration: metadata.duration
      }
    }
  );
}

/**
 * Express-style middleware wrapper for API routes
 */
export function apiLogger(
  req: NextRequest,
  res: NextResponse,
  next: () => void
) {
  // This is a simplified version for manual integration
  const startTime = Date.now();
  
  // Continue with request
  next();
  
  // Log after response (simplified)
  const duration = Date.now() - startTime;
  devLogger.logApiRequest(
    req.method,
    new URL(req.url).pathname,
    res.status,
    duration
  );
}

/**
 * Database query logging wrapper
 */
export function withDatabaseLogging<T extends (...args: Record<string, unknown>[]) => Promise<any>>(
  queryFunction: T,
  queryName: string
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction(...args);
      const duration = Date.now() - startTime;
      
      // Log successful query
      await devLogger.logDatabaseQuery(
        queryName,
        duration,
        Array.isArray(result) ? result.length : 1
      );
      
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      
      // Log failed query
      await devLogger.logDatabaseQuery(
        queryName,
        duration,
        0,
        error instanceof Error ? error : new Error(String(error))
      );
      
      throw error;
    }
  }) as T;
}
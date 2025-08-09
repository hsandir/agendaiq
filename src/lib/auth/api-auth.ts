import { NextRequest, NextResponse } from 'next/server';
import { 
  getCurrentUser, 
  checkAuthRequirements, 
  AuthRequirements, 
  AuthenticatedUser 
} from './auth-utils';

/**
 * API Response types
 */
export interface APIAuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Middleware for API routes that require authentication
 */
export async function withAuth(
  request: NextRequest,
  requirements: AuthRequirements = {}
): Promise<APIAuthResult> {
  
  try {
    const result = await checkAuthRequirements(requirements);
    
    if (!result.authorized) {
      return {
        success: false,
        error: result.error || 'Access denied',
        statusCode: result.user ? 403 : 401
      };
    }

    return {
      success: true,
      user: result.user!
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: 'Authentication error',
      statusCode: 500
    };
  }
}

/**
 * Create error response for unauthorized access
 */
export function createAuthErrorResponse(
  error: string, 
  statusCode: number = 401
): NextResponse {
  return NextResponse.json(
    { 
      error,
      code: statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  );
}

/**
 * Wrapper for API route handlers with authentication
 */
export function withAPIAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
  requirements: AuthRequirements = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await withAuth(request, requirements);
    
    if (!authResult.success) {
      return createAuthErrorResponse(
        authResult.error!,
        authResult.statusCode!
      );
    }

    try {
      return await handler(request, authResult.user!);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user has permission for specific resource
 */
export function hasResourcePermission(
  user: AuthenticatedUser,
  resourceType: 'meeting' | 'user' | 'school' | 'department' | 'district',
  resourceId: number,
  action: 'read' | 'write' | 'delete' | 'admin'
): boolean {
  
  // Admin can do everything
  if (user.staff?.role?.title === 'Administrator') {
    return true;
  }

  // No staff record = no permissions
  if (!user.staff) {
    return false;
  }

  const { staff } = user;
  
  switch (resourceType) {
    case 'meeting':
      // Users can read meetings in their department/school/district
      if (action === 'read') {
        return true; // For now, allow all staff to read meetings
      }
      // Leadership can write/delete in their scope
      return staff.role?.is_leadership || false;
      
    case 'user':
      // Users can read their own profile
      if (action === 'read' && resourceId === user.id) {
        return true;
      }
      // Leadership can manage users in their scope
      return staff.role?.is_leadership || false;
      
    case 'department':
      // Users can read their own department
      if (action === 'read' && resourceId === staff.department?.id) {
        return true;
      }
      // High priority roles can manage departments
      return (staff.role?.priority || 0) >= 80;
      
    case 'school':
      // Users can read their own school
      if (action === 'read' && resourceId === staff.school?.id) {
        return true;
      }
      // Principals and above can manage schools
      return ['Principal', 'Superintendent', 'Administrator'].includes(staff.role?.title || '');
      
    case 'district':
      // Users can read their own district
      if (action === 'read' && resourceId === staff.district?.id) {
        return true;
      }
      // Superintendents and admins can manage districts
      return ['Superintendent', 'Administrator'].includes(staff.role?.title || '');
      
    default:
      return false;
  }
}

/**
 * Common API auth patterns
 */
export const APIAuthPatterns = {
  /**
   * Public endpoint - no auth required
   */
  public: () => withAPIAuth(
    async (request: NextRequest, user: AuthenticatedUser) => {
      // This should not be reached as no auth is required
      throw new Error('Invalid usage of public pattern');
    },
    { requireAuth: false }
  ),

  /**
   * Basic authenticated endpoint
   */
  authenticated: (handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) =>
    withAPIAuth(handler, { requireAuth: true }),

  /**
   * Staff-only endpoint
   */
  staffOnly: (handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) =>
    withAPIAuth(handler, { requireAuth: true, requireStaff: true }),

  /**
   * Admin-only endpoint
   */
  adminOnly: (handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) =>
    withAPIAuth(handler, { requireAuth: true, requireStaff: true, requireAdminRole: true }),

  /**
   * Leadership-only endpoint
   */
  leadershipOnly: (handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) =>
    withAPIAuth(handler, { requireAuth: true, requireStaff: true, requireLeadership: true }),

  /**
   * Management-only endpoint (Principal, Superintendent, Admin)
   */
  managementOnly: (handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) =>
    withAPIAuth(handler, { 
      requireAuth: true, 
      requireStaff: true,
      requireLeadership: true
    }),
} as const;

/**
 * Helper to validate request parameters
 */
export function validateParams(
  params: Record<string, any>,
  required: string[]
): { valid: boolean; missing?: string[] } {
  
  const missing = required.filter(key => 
    params[key] === undefined || 
    params[key] === null || 
    params[key] === ''
  );

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined
  };
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  message: string, 
  missing?: string[]
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'VALIDATION_ERROR',
      missing,
      timestamp: new Date().toISOString()
    },
    { status: 400 }
  );
} 
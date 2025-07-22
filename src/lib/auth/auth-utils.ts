import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

// Types for better type safety
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string | null;
  staff?: {
    id: number;
    role: {
      id: number;
      title: string;
      priority: number;
      category: string | null;
      is_leadership: boolean;
    };
    department: {
      id: number;
      name: string;
      code: string;
    };
    school: {
      id: number;
      name: string;
      code: string | null;
    };
    district: {
      id: number;
      name: string;
      code: string | null;
    };
  } | null;
}

export interface AuthRequirements {
  requireAuth?: boolean;
  requireStaff?: boolean;
  requireAdminRole?: boolean;
  requireLeadership?: boolean;
}

export interface AuthResult {
  authorized: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Get the current authenticated user from session
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      staff: session.user.staff || null
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check authentication requirements
 */
export async function checkAuthRequirements(requirements: AuthRequirements = {}): Promise<AuthResult> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { 
        authorized: false, 
        error: 'Authentication required', 
        statusCode: 401 
      };
    }

    // Check staff requirement
    if (requirements.requireStaff && !user.staff) {
      return { 
        authorized: false, 
        error: 'Staff access required', 
        statusCode: 403 
      };
    }

    // Check admin role requirement
    if (requirements.requireAdminRole && user.staff?.role?.title !== 'Administrator') {
      return { 
        authorized: false, 
        error: 'Administrator access required', 
        statusCode: 403 
      };
    }

    // Check leadership requirement
    if (requirements.requireLeadership && !user.staff?.role?.is_leadership) {
      return { 
        authorized: false, 
        error: 'Leadership access required', 
        statusCode: 403 
      };
    }

    return { authorized: true, user };
  } catch (error) {
    console.error('Error checking auth requirements:', error);
    return { 
      authorized: false, 
      error: 'Authentication error', 
      statusCode: 500 
    };
  }
}

/**
 * Require authentication and redirect if not authenticated
 */
export async function requireAuth(requirements: AuthRequirements = {}): Promise<AuthenticatedUser> {
  const result = await checkAuthRequirements({ requireAuth: true, ...requirements });
  
  if (!result.authorized || !result.user) {
    redirect('/auth/signin');
  }

  return result.user;
}

/**
 * Predefined auth presets for common use cases
 */
export const AuthPresets = {
  requireAuth: { requireAuth: true },
  requireStaff: { requireAuth: true, requireStaff: true },
  requireAdmin: { requireAuth: true, requireStaff: true, requireAdminRole: true },
  requireLeadership: { requireAuth: true, requireStaff: true, requireLeadership: true }
}; 
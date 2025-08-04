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
  requireRole?: string[];
  requireAdminRole?: boolean;
  allowedRoles?: string[];
  minimumPriority?: number;
  requireLeadership?: boolean;
}

/**
 * Get current authenticated user with complete profile information
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        Staff: {
          select: {
            id: true,
            Role: {
              select: {
                id: true,
                title: true,
                priority: true,
                category: true,
                is_leadership: true,
              }
            },
            Department: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            },
            School: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            },
            District: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      staff: user.Staff.length > 0 ? {
        id: user.Staff[0].id,
        role: user.Staff[0].Role,
        department: user.Staff[0].Department,
        school: user.Staff[0].School,
        district: user.Staff[0].District,
      } : null
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Check if user meets authentication requirements
 */
export async function checkAuthRequirements(
  requirements: AuthRequirements = {}
): Promise<{ authorized: boolean; user: AuthenticatedUser | null; error?: string }> {
  
  const {
    requireAuth = true,
    requireStaff = false,
    requireRole = [],
    requireAdminRole = false,
    allowedRoles = [],
    minimumPriority,
    requireLeadership = false
  } = requirements;

  // Get current user
  const user = await getCurrentUser();

  // Check authentication
  if (requireAuth && !user) {
    return { authorized: false, user: null, error: 'Authentication required' };
  }

  // If no auth required and no user, return success
  if (!requireAuth && !user) {
    return { authorized: true, user: null };
  }

  // Check staff requirement
  if (requireStaff && !user?.staff) {
    return { 
      authorized: false, 
      user, 
      error: 'Staff membership required' 
    };
  }

  // Check admin role requirement
  if (requireAdminRole) {
    if (!user?.staff?.role || user.staff.role.title !== 'Administrator') {
      return { 
        authorized: false, 
        user, 
        error: 'Administrator role required' 
      };
    }
  }

  // Check specific role requirements
  if (requireRole.length > 0) {
    if (!user?.staff?.role || !requireRole.includes(user.staff.role.title)) {
      return { 
        authorized: false, 
        user, 
        error: `Required role: ${requireRole.join(' or ')}` 
      };
    }
  }

  // Check allowed roles
  if (allowedRoles.length > 0) {
    if (!user?.staff?.role || !allowedRoles.includes(user.staff.role.title)) {
      return { 
        authorized: false, 
        user, 
        error: `Access restricted to: ${allowedRoles.join(', ')}` 
      };
    }
  }

  // Check minimum priority
  if (minimumPriority !== undefined) {
    if (!user?.staff?.role || user.staff.role.priority < minimumPriority) {
      return { 
        authorized: false, 
        user, 
        error: `Insufficient role priority (minimum: ${minimumPriority})` 
      };
    }
  }

  // Check leadership requirement
  if (requireLeadership) {
    if (!user?.staff?.role || !user.staff.role.is_leadership) {
      return { 
        authorized: false, 
        user, 
        error: 'Leadership role required' 
      };
    }
  }

  return { authorized: true, user };
}

/**
 * Ensure user meets requirements or redirect/throw error
 */
export async function requireAuth(
  requirements: AuthRequirements = {},
  redirectPath = '/auth/signin'
): Promise<AuthenticatedUser> {
  
  const result = await checkAuthRequirements(requirements);
  
  if (!result.authorized) {
    if (!result.user) {
      // No user - redirect to signin
      redirect(redirectPath);
    } else {
      // User exists but doesn't meet requirements - throw error
      throw new Error(result.error || 'Access denied');
    }
  }

  return result.user!;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthenticatedUser | null, roleName: string): boolean {
  return user?.staff?.role?.title === roleName;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthenticatedUser | null): boolean {
  return hasRole(user, 'Administrator');
}

/**
 * Check if user has minimum priority
 */
export function hasMinimumPriority(user: AuthenticatedUser | null, minPriority: number): boolean {
  return (user?.staff?.role?.priority || 0) >= minPriority;
}

/**
 * Check if user has leadership role
 */
export function isLeader(user: AuthenticatedUser | null): boolean {
  return user?.staff?.role?.is_leadership || false;
}

/**
 * Get user's role title
 */
export function getUserRole(user: AuthenticatedUser | null): string | null {
  return user?.staff?.role?.title || null;
}

/**
 * Get user's department
 */
export function getUserDepartment(user: AuthenticatedUser | null) {
  return user?.staff?.department || null;
}

/**
 * Get user's school
 */
export function getUserSchool(user: AuthenticatedUser | null) {
  return user?.staff?.school || null;
}

/**
 * Get user's district
 */
export function getUserDistrict(user: AuthenticatedUser | null) {
  return user?.staff?.district || null;
}

/**
 * Common auth requirements presets
 */
export const AuthPresets = {
  // Basic authentication
  requireUser: { requireAuth: true },
  
  // Staff member required
  requireStaff: { requireAuth: true, requireStaff: true },
  
  // Admin only
  adminOnly: { requireAuth: true, requireStaff: true, requireAdminRole: true },
  
  // Leadership roles
  leadershipOnly: { requireAuth: true, requireStaff: true, requireLeadership: true },
  
  // High priority roles (priority >= 80)
  highPriority: { requireAuth: true, requireStaff: true, minimumPriority: 80 },
  
  // Teachers and above
  teacherAndAbove: { 
    requireAuth: true, 
    requireStaff: true, 
    allowedRoles: ['Teacher', 'Principal', 'Superintendent', 'Administrator'] 
  },
  
  // Management roles
  managementOnly: { 
    requireAuth: true, 
    requireStaff: true, 
    allowedRoles: ['Principal', 'Superintendent', 'Administrator'] 
  },
} as const; 
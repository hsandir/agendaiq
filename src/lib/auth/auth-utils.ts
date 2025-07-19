import { getServerSession } from 'next-auth/next';
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
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
    const user = await requireAuth(AuthPresets.requireAuth); else {
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
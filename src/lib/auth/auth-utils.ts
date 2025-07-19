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
  requireAdminRole?: boolean;
  requireLeadership?: boolean;
  allowedRoles?: string[];
  allowedDepartments?: string[];
  allowedSchools?: string[];
}

export interface AuthResult {
  authorized: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Get current user from session
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
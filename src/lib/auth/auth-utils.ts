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

// Auth presets for common use cases
export const AuthPresets = {
  requireAuth: { requireAuth: true },
  requireStaff: { requireAuth: true, requireStaff: true },
  requireAdmin: { requireAuth: true, requireAdminRole: true },
  requireLeadership: { requireAuth: true, requireLeadership: true },
} as const;

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true,
            District: true
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
      staff: user.Staff[0] ? {
        id: user.Staff[0].id,
        role: {
          id: user.Staff[0].Role.id,
          title: user.Staff[0].Role.title,
          priority: user.Staff[0].Role.priority,
          category: user.Staff[0].Role.category,
          is_leadership: user.Staff[0].Role.is_leadership,
        },
        department: {
          id: user.Staff[0].Department.id,
          name: user.Staff[0].Department.name,
          code: user.Staff[0].Department.code,
        },
        school: {
          id: user.Staff[0].School.id,
          name: user.Staff[0].School.name,
          code: user.Staff[0].School.code,
        },
        district: {
          id: user.Staff[0].District.id,
          name: user.Staff[0].District.name,
          code: user.Staff[0].District.code,
        },
      } : null
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication and optionally specific roles/permissions
 */
export async function requireAuth(requirements: AuthRequirements = AuthPresets.requireAuth): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  if (requirements.requireStaff && !user.staff) {
    redirect('/auth/signin?error=staff_required');
  }

  if (requirements.requireAdminRole && user.staff?.role.title !== 'Administrator') {
    redirect('/auth/signin?error=admin_required');
  }

  if (requirements.requireLeadership && !user.staff?.role.is_leadership) {
    redirect('/auth/signin?error=leadership_required');
  }

  if (requirements.allowedRoles && user.staff && !requirements.allowedRoles.includes(user.staff.role.title)) {
    redirect('/auth/signin?error=role_not_allowed');
  }

  if (requirements.allowedDepartments && user.staff && !requirements.allowedDepartments.includes(user.staff.department.name)) {
    redirect('/auth/signin?error=department_not_allowed');
  }

  if (requirements.allowedSchools && user.staff && !requirements.allowedSchools.includes(user.staff.school.name)) {
    redirect('/auth/signin?error=school_not_allowed');
  }

  return user;
} 
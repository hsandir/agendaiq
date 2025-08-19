import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Logger } from '@/lib/utils/logger';
import { 
  Capability, 
  UserWithCapabilities, 
  getUserCapabilities, 
  can,
  isDevAdmin,
  isOpsAdmin,
  enrichUserWithCapabilities 
} from './policy';

// Types for better type safety - extend UserWithCapabilities
export interface AuthenticatedUser extends UserWithCapabilities {
  staff?: {
    id: number;
    role?: {
      id: number;
      key?: string | null;
      title: string;
      priority?: number;
      category?: string | null;
      is_leadership?: boolean;
    };
    department?: {
      id: number;
      name: string;
      code: string;
    };
    school?: {
      id: number;
      name: string;
      code: string | null;
    };
    district?: {
      id: number;
      name: string;
      code: string | null;
    };
  };
}

export interface AuthRequirements {
  requireAuth?: boolean;
  requireStaff?: boolean;
  requireAdminRole?: boolean; // Deprecated - use requireCapability
  requireLeadership?: boolean; // Deprecated - use requireCapability
  requireCapability?: Capability | Capability[];
  requireDevAdmin?: boolean;
  requireOpsAdmin?: boolean;
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
      // No session or user email found
      return null;
    }

    // Get user from database to get latest admin flags and capabilities
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Staff: {
          include: {
            Role: {
              include: {
                Permissions: true
              }
            },
            Department: true,
            School: true,
            District: true
          }
        }
      }
    });

    if (!dbUser) {
      // User not found in database
      return null;
    }

    // Enrich user with capabilities
    const userWithCapabilities = await enrichUserWithCapabilities({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      is_system_admin: dbUser.is_system_admin,
      is_school_admin: dbUser.is_school_admin,
      staff: dbUser.Staff && dbUser.Staff.length > 0 ? {
        id: dbUser.Staff[0].id,
        role: {
          id: dbUser.Staff[0].Role.id,
          key: dbUser.Staff[0].Role.key,
          title: dbUser.Staff[0].Role.title,
          priority: dbUser.Staff[0].Role.priority,
          category: dbUser.Staff[0].Role.category,
          is_leadership: dbUser.Staff[0].Role.is_leadership
        },
        department: {
          id: dbUser.Staff[0].Department.id,
          name: dbUser.Staff[0].Department.name,
          code: dbUser.Staff[0].Department.code
        },
        school: {
          id: dbUser.Staff[0].School.id,
          name: dbUser.Staff[0].School.name,
          code: dbUser.Staff[0].School.code
        },
        district: {
          id: dbUser.Staff[0].District.id,
          name: dbUser.Staff[0].District.name,
          code: dbUser.Staff[0].District.code
        }
      } : null
    });

    // User successfully retrieved with capabilities

    return userWithCapabilities;
  } catch (error: unknown) {
    Logger.error('Error getting current user:', { error });
    return null;
  }
}

/**
 * Check authentication requirements
 */
export async function checkAuthRequirements(requirements: AuthRequirements = {}): Promise<AuthResult> {
  try {
    // Checking auth requirements
    const user = await getCurrentUser();
    
    // User check completed
    
    if (!user) {
      // No user found - authentication required
      return { 
        authorized: false, 
        error: 'Authentication required', 
        statusCode: 401 
      };
    }

    // Check staff requirement
    if (requirements.requireStaff && !user.staff) {
      // Staff access required but user has no staff record
      return { 
        authorized: false, 
        error: 'Staff access required', 
        statusCode: 403 
      };
    }

    // Check capability requirement (new system)
    if (requirements.requireCapability) {
      if (!can(user, requirements.requireCapability)) {
        // Capability required but user lacks permission
        return { 
          authorized: false, 
          error: 'Insufficient permissions', 
          statusCode: 403 
        };
      }
    }
    
    // Check dev admin requirement
    if (requirements.requireDevAdmin && !isDevAdmin(user)) {
      // Developer admin access required
      return { 
        authorized: false, 
        error: 'Developer admin access required', 
        statusCode: 403 
      };
    }
    
    // Check ops admin requirement
    if (requirements.requireOpsAdmin && !isOpsAdmin(user)) {
      // Operations admin access required
      return { 
        authorized: false, 
        error: 'Operations admin access required', 
        statusCode: 403 
      };
    }

    // Legacy checks (deprecated but kept for backward compatibility)
    if (requirements.requireAdminRole) {
      // Use capability-based admin check
      const isAdmin = isOpsAdmin(user) || isDevAdmin(user);
      if (!isAdmin) {
        // Administrator access required but user is not admin
        return { 
          authorized: false, 
          error: 'Administrator access required', 
          statusCode: 403 
        };
      }
    }

    // Check leadership requirement (legacy)
    if (requirements.requireLeadership && !user.staff?.role?.is_leadership) {
      // Leadership access required but user is not leadership
      return { 
        authorized: false, 
        error: 'Leadership access required', 
        statusCode: 403 
      };
    }

    // Auth requirements satisfied
    return { authorized: true, user };
  } catch (error: unknown) {
    console.error('❌ Error checking auth requirements:', error);
    Logger.error('Error checking auth requirements', { error: String(error) }, 'auth');
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
  requireAdmin: { requireAuth: true, requireStaff: true, requireAdminRole: true }, // Legacy
  requireLeadership: { requireAuth: true, requireStaff: true, requireLeadership: true }, // Legacy
  
  // New capability-based presets
  requireDevAdmin: { requireAuth: true, requireCapability: Capability.DEV_DEBUG },
  requireOpsAdmin: { requireAuth: true, requireCapability: Capability.OPS_HEALTH },
  requireAnyAdmin: { requireAuth: true, requireCapability: [Capability.USER_MANAGE, Capability.DEV_DEBUG] },
  
  // Development access
  requireDevelopment: { requireAuth: true, requireCapability: Capability.DEV_DEBUG },
  
  // Operations access  
  requireMonitoring: { requireAuth: true, requireCapability: Capability.OPS_MONITORING },
  requireLogs: { requireAuth: true, requireCapability: Capability.OPS_LOGS },
  
  // Management access
  requireUserManagement: { requireAuth: true, requireCapability: Capability.USER_MANAGE },
  requireRoleManagement: { requireAuth: true, requireCapability: Capability.ROLE_MANAGE },
  
  // Meeting access
  requireMeetingCreate: { requireAuth: true, requireCapability: Capability.MEETING_CREATE },
  requireMeetingView: { requireAuth: true, requireCapability: Capability.MEETING_VIEW }
}; 
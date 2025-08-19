/**
 * Centralized RBAC Policy System
 * Single source of truth for all authorization decisions
 */

import { prisma } from '@/lib/prisma';

// Role Keys - Standardized role identifiers
export enum RoleKey {
  DEV_ADMIN = 'DEV_ADMIN',
  OPS_ADMIN = 'OPS_ADMIN',
  CHIEF_EDU_OFFICER = 'CHIEF_EDU_OFFICER',
  DIR_OPERATIONS = 'DIR_OPERATIONS',
  BUS_ADMIN = 'BUS_ADMIN',
  ASST_BUS_ADMIN = 'ASST_BUS_ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  ASST_PRINCIPAL = 'ASST_PRINCIPAL',
  LEAD_TEACHER = 'LEAD_TEACHER',
  TEACHER = 'TEACHER',
  SUPPORT_STAFF = 'SUPPORT_STAFF'
}

// Capability definitions
export enum Capability {
  // Development capabilities
  DEV_CI = 'dev:ci',
  DEV_GIT = 'dev:git',
  DEV_SEED = 'dev:seed',
  DEV_LINT = 'dev:lint',
  DEV_DEBUG = 'dev:debug',
  DEV_UPDATE = 'dev:update',
  DEV_FIX = 'dev:fix',
  DEV_MOCKDATA = 'dev:mockdata',
  
  // Operations capabilities
  OPS_MONITORING = 'ops:monitoring',
  OPS_ALERTS = 'ops:alerts',
  OPS_BACKUP = 'ops:backup',
  OPS_LOGS = 'ops:logs',
  OPS_HEALTH = 'ops:health',
  OPS_DB_READ = 'ops:db:read',
  OPS_DB_WRITE = 'ops:db:write',
  
  // Management capabilities
  USER_MANAGE = 'user:manage',
  USER_VIEW = 'user:view',
  ROLE_MANAGE = 'role:manage',
  ROLE_VIEW = 'role:view',
  PERM_MANAGE = 'perm:manage',
  SCHOOL_MANAGE = 'school:manage',
  SCHOOL_VIEW = 'school:view',
  STAFF_IMPORT = 'staff:import',
  STAFF_MANAGE = 'staff:manage',
  STAFF_VIEW = 'staff:view',
  
  // Meeting capabilities
  MEETING_CREATE = 'meeting:create',
  MEETING_VIEW = 'meeting:view',
  MEETING_EDIT = 'meeting:edit',
  MEETING_EDIT_OWN = 'meeting:edit:own',
  MEETING_DELETE = 'meeting:delete'
}

// Route Policy - Maps paths to required capabilities
export const RoutePolicy: Record<string, Capability | Capability[]> = {
  // Development pages
  '/dashboard/development': Capability.DEV_DEBUG,
  '/dashboard/tests': Capability.DEV_DEBUG,
  '/dashboard/theme-debug': Capability.DEV_DEBUG,
  '/dashboard/theme-demo': Capability.DEV_DEBUG,
  '/dashboard/theme-test': Capability.DEV_DEBUG,
  
  // System pages
  '/dashboard/system/dependencies': Capability.DEV_DEBUG,
  '/dashboard/system/lint': Capability.DEV_LINT,
  '/dashboard/system/migration': Capability.DEV_UPDATE,
  '/dashboard/system/mock-data-tracker': Capability.DEV_MOCKDATA,
  '/dashboard/system/updates': Capability.DEV_UPDATE,
  
  // Monitoring & Operations
  '/dashboard/monitoring': Capability.OPS_MONITORING,
  '/dashboard/system': Capability.OPS_HEALTH,
  '/dashboard/system/alerts': Capability.OPS_ALERTS,
  '/dashboard/system/backup': Capability.OPS_BACKUP,
  '/dashboard/system/health': Capability.OPS_HEALTH,
  '/dashboard/system/health-overview': Capability.OPS_HEALTH,
  '/dashboard/system/logs': Capability.OPS_LOGS,
  '/dashboard/system/server': Capability.OPS_HEALTH,
  '/dashboard/system/database': Capability.OPS_DB_READ,
  
  // Settings - Administration
  '/dashboard/settings/audit': Capability.OPS_LOGS,
  '/dashboard/settings/audit-logs': Capability.OPS_LOGS,
  '/dashboard/settings/meeting-audit': Capability.OPS_LOGS,
  '/dashboard/settings/backup': Capability.OPS_BACKUP,
  '/dashboard/settings/permissions': Capability.PERM_MANAGE,
  '/dashboard/settings/role-hierarchy': Capability.ROLE_MANAGE,
  '/dashboard/settings/role-hierarchy/roles': Capability.ROLE_MANAGE,
  '/dashboard/settings/school': Capability.SCHOOL_MANAGE,
  '/dashboard/settings/staff-upload': Capability.STAFF_IMPORT,
  '/dashboard/settings/setup': Capability.DEV_UPDATE,
  
  // Meetings
  '/dashboard/meetings/new': Capability.MEETING_CREATE,
  
  // Setup
  '/setup/district': Capability.DEV_UPDATE
};

// API Route Policy - CRITICAL SECURITY ENFORCEMENT
export const ApiRoutePolicy: Record<string, Capability | Capability[]> = {
  // Dev APIs - CRITICAL SECURITY - DEV_ADMIN ONLY
  '/api/dev': Capability.DEV_DEBUG,
  '/api/debug': Capability.DEV_DEBUG,
  '/api/tests': Capability.DEV_DEBUG,
  '/api/test-sentry': Capability.DEV_DEBUG,
  '/api/system/lint': Capability.DEV_LINT,
  '/api/system/lint-errors': Capability.DEV_LINT,
  '/api/system/fix': Capability.DEV_FIX,
  '/api/system/error-fix': Capability.DEV_FIX,
  '/api/system/update': Capability.DEV_UPDATE,
  '/api/system/mock-data-scan': Capability.DEV_MOCKDATA,
  '/api/system/diagnostic': Capability.DEV_DEBUG,
  '/api/monitoring/logs/dev': Capability.DEV_DEBUG,
  '/api/internal': Capability.DEV_DEBUG,
  
  // Ops APIs - SYSTEM ADMINISTRATION - OPS_ADMIN + DEV_ADMIN
  '/api/monitoring': Capability.OPS_MONITORING,
  '/api/system/alerts': Capability.OPS_ALERTS,
  '/api/system/backup': Capability.OPS_BACKUP,
  '/api/system/database': Capability.OPS_DB_READ,
  '/api/system/server': Capability.OPS_HEALTH,
  '/api/system/status': Capability.OPS_HEALTH,
  '/api/system/settings': Capability.OPS_HEALTH,
  '/api/system/health': Capability.OPS_HEALTH,
  '/api/system/logs': Capability.OPS_LOGS,
  
  // Admin APIs - USER AND ROLE MANAGEMENT - OPS_ADMIN + DEV_ADMIN
  '/api/admin': Capability.OPS_HEALTH,
  '/api/users': Capability.USER_MANAGE,
  '/api/user/admin-update': Capability.USER_MANAGE,
  '/api/user/switch-role': Capability.ROLE_MANAGE,
  '/api/user/revoke': Capability.USER_MANAGE,
  
  // Setup APIs - CRITICAL SECURITY - DEV_ADMIN ONLY
  '/api/setup/init': Capability.DEV_UPDATE,
  '/api/district/setup': Capability.DEV_UPDATE,
  '/api/auth/create-admin': Capability.DEV_UPDATE,
  '/api/auth/admin-users': Capability.USER_MANAGE,
  
  // School Management APIs - OPS_ADMIN + DEV_ADMIN
  '/api/schools': Capability.SCHOOL_MANAGE,
  '/api/school': Capability.SCHOOL_MANAGE,
  '/api/departments': Capability.SCHOOL_MANAGE,
  '/api/staff/upload': Capability.STAFF_IMPORT,
  '/api/roles': Capability.ROLE_MANAGE,
  
  // Error Tracking APIs - OPS_ADMIN + DEV_ADMIN
  '/api/errors': Capability.OPS_MONITORING,
  '/api/error-capture': Capability.OPS_MONITORING,
  
  // Meeting APIs - AUTHENTICATED USERS
  '/api/meetings': Capability.MEETING_VIEW,
  '/api/meeting-templates': Capability.MEETING_VIEW,
  '/api/meeting-intelligence': Capability.MEETING_VIEW
};

// User interface with capabilities
export interface UserWithCapabilities {
  id: number;
  email: string;
  name?: string | null;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  roleKey?: string;
  capabilities?: string[];
  staff?: {
    id: number;
    role?: {
      id: number;
      key?: string | null;
      title: string;
      is_leadership?: boolean;
    };
  };
}

// Get user's capabilities from database
export async function getUserCapabilities(userId: number): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Staff: {
          include: {
            Role: {
              include: {
                Permissions: true
              }
            }
          }
        }
      }
    });
    
    if (!user) return [];
    
    // System admin gets all capabilities
    if (user.is_system_admin) {
      return Object.values(Capability);
    }
    
    // School admin gets ops and management capabilities
    if (user.is_school_admin) {
      return Object.values(Capability).filter(cap => 
        cap.startsWith('ops:') || 
        cap.includes('manage') || 
        cap.includes('view') ||
        cap.startsWith('meeting:')
      );
    }
    
    // Get capabilities from role permissions  
    if (user.Staff?.[0]?.Role?.Permissions) {
      return user.Staff[0].Role.Permissions.map((p: Record<string, unknown>) => p.capability);
    }
    
    return [];
  } catch (error: unknown) {
    console.error('Error getting user capabilities:', error);
    return [];
  }
}

// Main authorization function
export function can(
  user: UserWithCapabilities | null | undefined, 
  capability: Capability | Capability[],
  context?: Record<string, unknown>
): boolean {
  if (!user) return false;
  
  // System admin can do everything
  if (user.is_system_admin) return true;
  
  // Check if capability is an array
  if (Array.isArray(capability)) {
    return capability.some(cap => can(user, cap, context));
  }
  
  // School admin special permissions
  if (user.is_school_admin) {
    // School admin cannot access dev capabilities
    if (capability.startsWith('dev:')) return false;
    
    // School admin can access ops and management
    if (capability.startsWith('ops:') || 
        capability.includes('manage') || 
        capability.includes('view') ||
        capability.startsWith('meeting:')) {
      return true;
    }
  }
  
  // Check user's specific capabilities
  if (user.capabilities?.includes(capability)) {
    // Handle context-specific checks (e.g., own resources)
    if (capability === Capability.MEETING_EDIT_OWN && context?.ownerId) {
      return context.ownerId === user.id ?? context.ownerId === user.staff?.id;
    }
    return true;
  }
  
  return false;
}

// Helper functions
export function isDevAdmin(user: UserWithCapabilities | null | undefined): boolean {
  if (!user) return false;
  return user.is_system_admin === true ?? user.roleKey === RoleKey.DEV_ADMIN;
}

export function isOpsAdmin(user: UserWithCapabilities | null | undefined): boolean {
  if (!user) return false;
  return user.is_school_admin === true ?? user.roleKey === RoleKey.OPS_ADMIN;
}

export function isAnyAdmin(user: UserWithCapabilities | null | undefined): boolean {
  return isDevAdmin(user) || isOpsAdmin(user);
}

export function canAccessDevelopment(user: UserWithCapabilities | null | undefined): boolean {
  return can(user, Capability.DEV_DEBUG);
}

export function canManageSchool(user: UserWithCapabilities | null | undefined): boolean {
  return can(user, [Capability.SCHOOL_MANAGE, Capability.USER_MANAGE, Capability.ROLE_MANAGE]);
}

export function canViewLogs(user: UserWithCapabilities | null | undefined): boolean {
  return can(user, Capability.OPS_LOGS);
}

// Check route access
export function canAccessRoute(user: UserWithCapabilities | null | undefined, path: string): boolean {
  // Find matching route policy
  for (const [pattern, capability] of Object.entries(RoutePolicy)) {
    if (path.startsWith(pattern)) {
      return can(user, capability);
    }
  }
  
  // Default allow for unspecified routes (public pages)
  return true;
}

// Check API access
export function canAccessApi(user: UserWithCapabilities | null | undefined, path: string): boolean {
  // Public APIs that don't require authentication
  const publicApis = [
    '/api/auth',
    '/api/health',
    '/api/setup/check'
  ];
  
  // Check if it's a public API
  for (const publicApi of publicApis) {
    if (path.startsWith(publicApi)) {
      return true;
    }
  }
  
  // Find matching API policy
  for (const [pattern, capability] of Object.entries(ApiRoutePolicy)) {
    if (path.startsWith(pattern)) {
      return can(user, capability);
    }
  }
  
  // Default DENY for unspecified APIs - SECURITY BY DEFAULT
  // If an API is not explicitly listed, it requires authentication
  return user !== null && user !== undefined;
}

// Get user with capabilities (for auth)
export async function enrichUserWithCapabilities(user: Record<string, unknown>): Promise<UserWithCapabilities> {
  const capabilities = await getUserCapabilities(user.id);
  
  return {
    ...user,
    capabilities,
    roleKey: user.staff?.role?.key ?? user.Staff?.Role?.key
  };
}
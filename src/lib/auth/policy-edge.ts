/**
 * Edge-Compatible RBAC Policy System
 * Functions that can run in middleware (edge runtime)
 * No Prisma imports allowed
 */

// Role IDs - Database role identifiers
export const RoleID = {
  DEV_ADMIN: 1,        // Developer Admin
  OPS_ADMIN: 2,        // Operations Admin
  PRINCIPAL: 3,        // Principal
  ASST_PRINCIPAL: 4,   // Assistant Principal
  TEACHER: 5,          // Teacher
  LEAD_TEACHER: 6,     // Lead Teacher
  SUPPORT_STAFF: 7,    // Support Staff
  CHIEF_EDU_OFFICER: 8, // Chief Education Officer
  DIR_OPERATIONS: 9,    // Director of Operations
  BUS_ADMIN: 10,        // Business Administrator
  ASST_BUS_ADMIN: 11    // Assistant Business Administrator
} as const;

export type RoleID = typeof RoleID[keyof typeof RoleID];

// Legacy RoleKey mapping for backward compatibility during migration
export const RoleKey = {
  DEV_ADMIN: 'DEV_ADMIN',
  OPS_ADMIN: 'OPS_ADMIN',
  CHIEF_EDU_OFFICER: 'CHIEF_EDU_OFFICER',
  DIR_OPERATIONS: 'DIR_OPERATIONS',
  BUS_ADMIN: 'BUS_ADMIN',
  ASST_BUS_ADMIN: 'ASST_BUS_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  ASST_PRINCIPAL: 'ASST_PRINCIPAL',
  LEAD_TEACHER: 'LEAD_TEACHER',
  TEACHER: 'TEACHER',
  SUPPORT_STAFF: 'SUPPORT_STAFF'
} as const;

export type RoleKey = typeof RoleKey[keyof typeof RoleKey];

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

  // System administration capabilities
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_HEALTH = 'system:health',
  SYSTEM_MONITORING = 'system:monitoring',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_UPDATE = 'system:update',
  SYSTEM_ALERTS = 'system:alerts',
  SYSTEM_DATABASE = 'system:database',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_METRICS = 'system:metrics',

  // User management capabilities
  USER_ADMIN = 'user:admin',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_VIEW = 'user:view',
  USER_ASSIGN_ROLES = 'user:assign_roles',

  // Meeting management capabilities
  MEETING_CREATE = 'meeting:create',
  MEETING_EDIT = 'meeting:edit',
  MEETING_DELETE = 'meeting:delete',
  MEETING_VIEW = 'meeting:view',
  MEETING_MODERATE = 'meeting:moderate',
  MEETING_INTELLIGENCE = 'meeting:intelligence',
  MEETING_TEMPLATES = 'meeting:templates',

  // School administration capabilities
  SCHOOL_ADMIN = 'school:admin',
  SCHOOL_SETTINGS = 'school:settings',
  SCHOOL_STAFF_MANAGE = 'school:staff_manage',
  SCHOOL_DEPARTMENTS = 'school:departments',

  // Audit and monitoring capabilities
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',
  MONITORING_VIEW = 'monitoring:view',
  MONITORING_ALERTS = 'monitoring:alerts',

  // Team management capabilities
  TEAM_CREATE = 'team:create',
  TEAM_EDIT = 'team:edit',
  TEAM_DELETE = 'team:delete',
  TEAM_VIEW = 'team:view',
  TEAM_MANAGE_MEMBERS = 'team:manage_members',
  TEAM_KNOWLEDGE = 'team:knowledge',
}

// User interface for middleware
export interface UserWithCapabilities {
  id: number;
  email: string;
  name?: string;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  roleKey?: string;
  capabilities?: string[];
  staff?: {
    id: number;
    role?: {
      id: number;
      key?: string | null;
      is_leadership?: boolean;
    };
  };
}

// Edge-safe route access control using pre-computed capabilities
export function canAccessRoute(user: UserWithCapabilities | null, path: string): boolean {
  if (!user) return false;

  // System admin can access everything
  if (user.is_system_admin || user.roleKey === 'DEV_ADMIN') {
    return true;
  }

  // Basic dashboard access for authenticated users
  if (path === '/dashboard') {
    return true;
  }

  // Development routes - only for dev admin
  if (path.startsWith('/dashboard/development')) {
    return user.roleKey === 'DEV_ADMIN' || (user.capabilities?.includes(Capability.DEV_DEBUG) ?? false);
  }

  // System administration routes
  if (path.startsWith('/dashboard/system')) {
    return user.is_system_admin || 
           user.capabilities?.includes(Capability.SYSTEM_ADMIN) ||
           user.roleKey === 'OPS_ADMIN';
  }

  // Monitoring routes
  if (path.startsWith('/dashboard/monitoring')) {
    return user.is_system_admin || 
           user.capabilities?.includes(Capability.MONITORING_VIEW) ||
           user.roleKey === 'DEV_ADMIN' ||
           user.roleKey === 'OPS_ADMIN';
  }

  // Settings routes
  if (path.startsWith('/dashboard/settings')) {
    // Profile settings - everyone can access
    if (path.includes('/profile') || path.includes('/theme') || path.includes('/layout')) {
      return true;
    }
    
    // Admin settings
    if (path.includes('/system') || path.includes('/audit') || path.includes('/backup')) {
      return (user.is_system_admin ?? false) || (user.is_school_admin ?? false);
    }
    
    // School admin settings
    if (path.includes('/school') || path.includes('/staff')) {
      return (user.is_school_admin ?? false) || (user.capabilities?.includes(Capability.SCHOOL_ADMIN) ?? false);
    }
    
    // Role management
    if (path.includes('/role-hierarchy')) {
      return (user.is_system_admin ?? false) || (user.is_school_admin ?? false);
    }
    
    // General settings access for leadership
    return (user.staff?.role?.is_leadership ?? false) || (user.is_school_admin ?? false) || (user.is_system_admin ?? false);
  }

  // Meeting routes
  if (path.startsWith('/dashboard/meeting')) {
    return user.capabilities?.includes(Capability.MEETING_VIEW) || 
           user.capabilities?.includes(Capability.MEETING_CREATE) ||
           true; // Most users can access meetings
  }

  // Teams routes
  if (path.startsWith('/dashboard/teams')) {
    return user.capabilities?.includes(Capability.TEAM_VIEW) || 
           user.capabilities?.includes(Capability.TEAM_CREATE) ||
           true; // Most users can access teams
  }

  // Default: allow access for basic authenticated users
  return true;
}

// Edge-safe API access control using pre-computed capabilities
export function canAccessApi(user: UserWithCapabilities | null, path: string): boolean {
  if (!user) return false;

  // System admin can access everything
  if (user.is_system_admin || user.roleKey === 'DEV_ADMIN') {
    return true;
  }

  // Development API routes
  if (path.startsWith('/api/dev/')) {
    return user.roleKey === 'DEV_ADMIN' || user.capabilities?.includes(Capability.DEV_DEBUG);
  }

  // System API routes
  if (path.startsWith('/api/system/')) {
    return user.is_system_admin || 
           user.capabilities?.includes(Capability.SYSTEM_ADMIN) ||
           user.roleKey === 'OPS_ADMIN';
  }

  // Admin API routes
  if (path.startsWith('/api/admin/')) {
    return user.is_system_admin || user.is_school_admin;
  }

  // Monitoring API routes
  if (path.startsWith('/api/monitoring/')) {
    return user.is_system_admin || 
           user.capabilities?.includes(Capability.MONITORING_VIEW) ||
           user.roleKey === 'OPS_ADMIN';
  }

  // User management API
  if (path.startsWith('/api/users/')) {
    return user.is_system_admin || 
           user.is_school_admin ||
           user.capabilities?.includes(Capability.USER_VIEW);
  }

  // Meeting API
  if (path.startsWith('/api/meeting')) {
    return user.capabilities?.includes(Capability.MEETING_VIEW) || 
           user.capabilities?.includes(Capability.MEETING_CREATE) ||
           true; // Most users can access meeting APIs
  }

  // Teams API
  if (path.startsWith('/api/teams/')) {
    return user.capabilities?.includes(Capability.TEAM_VIEW) || 
           user.capabilities?.includes(Capability.TEAM_CREATE) ||
           true; // Most users can access team APIs
  }

  // User profile API - accessible to authenticated users
  if (path.startsWith('/api/user/')) {
    return true;
  }

  // Default: allow access for authenticated users to non-admin APIs
  return true;
}
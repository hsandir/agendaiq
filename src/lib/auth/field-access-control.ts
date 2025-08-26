// Field-level access control for AgendaIQ
// This system controls which fields users can view/edit based on their roles

import { User } from "next-auth";
import { AuthenticatedUser } from "./auth-utils";
import { can, isRole, RoleKey, Capability } from "./policy";

export interface FieldAccessRule {
  field: string;
  read: string[];  // Roles that can read
  write: string[]; // Roles that can write
}

export interface ModelAccessRules {
  [model: string]: {
    fields: FieldAccessRule[];
    defaults?: {
      read: string[];
      write: string[];
    };
  };
}

// Define field-level access rules for each model
export const ACCESS_RULES: ModelAccessRules = {
  users: {
    defaults: {
      read: ['self'], // Users can read their own data
      write: ['self'] // Users can edit their own data
    },
    fields: [
      {
        field: 'email',
        read: ['self', 'Administrator', 'HR'],
        write: ['self', 'Administrator']
      },
      {
        field: 'hashedPassword',
        read: [], // No one can read password hash
        write: ['self'] // Only user can change their password
      },
      {
        field: 'is_admin',
        read: ['Administrator'],
        write: ['Administrator']
      },
      {
        field: 'two_factor_secret',
        read: [], // No one can read 2FA secret
        write: ['self']
      },
      {
        field: 'backup_codes',
        read: ['self'], // Only user can see their backup codes
        write: ['self']
      }
    ]
  },
  staff: {
    defaults: {
      read: ['all'], // All staff can see basic staff info
      write: ['Administrator', 'HR']
    },
    fields: [
      {
        field: 'salary',
        read: ['self', 'Administrator', 'HR', 'Finance'],
        write: ['Administrator', 'HR']
      },
      {
        field: 'performance_rating',
        read: ['self', 'manager', 'Administrator', 'HR'],
        write: ['manager', 'Administrator', 'HR']
      },
      {
        field: 'flags',
        read: ['Administrator', 'HR'],
        write: ['Administrator', 'HR']
      }
    ]
  },
  meeting: {
    defaults: {
      read: ['attendees', 'organizer'], // Attendees and organizer can read
      write: ['organizer', 'Administrator']
    },
    fields: [
      {
        field: 'private_notes',
        read: ['organizer'],
        write: ['organizer']
      },
      {
        field: 'confidential',
        read: ['attendees', 'organizer', 'leadership'],
        write: ['organizer', 'leadership']
      }
    ]
  },
  school: {
    defaults: {
      read: ['all'], // All can read basic school info
      write: ['Administrator', 'Principal']
    },
    fields: [
      {
        field: 'budget',
        read: ['Administrator', 'Principal', 'Finance'],
        write: ['Administrator', 'Finance']
      },
      {
        field: 'enrollment_capacity',
        read: ['Administrator', 'Principal', 'Registrar'],
        write: ['Administrator', 'Registrar']
      }
    ]
  }
};

// Check if user has read access to a field
export function canReadField(
  user: User | AuthenticatedUser,
  model: string,
  field: string,
  record?: Record<string, unknown>
): boolean {
  const modelRules = ACCESS_RULES[model];
  if (!modelRules) return true; // No rules defined, allow access

  // Find specific field rule
  const fieldRule = modelRules.fields.find(f => f.field === field);
  const allowedRoles = fieldRule?.read ?? modelRules.defaults?.read ?? [];

  return checkAccess(user, allowedRoles, record);
}

// Check if user has write access to a field
export function canWriteField(
  user: User | AuthenticatedUser,
  model: string,
  field: string,
  record?: Record<string, unknown>
): boolean {
  const modelRules = ACCESS_RULES[model];
  if (!modelRules) return false; // No rules defined, deny write

  // Find specific field rule
  const fieldRule = modelRules.fields.find(f => f.field === field);
  const allowedRoles = fieldRule?.write ?? modelRules.defaults?.write ?? [];

  return checkAccess(user, allowedRoles, record);
}

// Check access based on roles
function checkAccess(
  user: User | AuthenticatedUser,
  allowedRoles: string[],
  record?: Record<string, unknown>
): boolean {
  // Check special keywords
  if (allowedRoles.includes('all')) return true;
  
  if (allowedRoles.includes('self') && record?.user_id === user?.id) {
    return true;
  }

  if (allowedRoles.includes('manager') && user.staff?.id === record?.manager_id) {
    return true;
  }

  if (allowedRoles.includes('attendees') && record?.attendees?.some((a: Record<string, unknown>) => a.staff_id === user.staff?.id)) {
    return true;
  }

  if (allowedRoles.includes('organizer') && record?.organizer_id === user?.id) {
    return true;
  }

  if (allowedRoles.includes('leadership') && user.staff?.role?.is_leadership) {
    return true;
  }

  // Check role-based access using capabilities instead of titles
  for (const allowedRole of allowedRoles) {
    if (checkRoleAccess(user, allowedRole)) {
      return true;
    }
  }

  return false;
}

// Map role titles to capability checks (secure replacement for title-based auth)
function checkRoleAccess(user: User | AuthenticatedUser, roleTitle: string): boolean {
  // Map common role titles to capabilities
  switch (roleTitle) {
    case 'Administrator':
    case 'System Administrator':
      return isRole(user, RoleKey.OPS_ADMIN) || can(user, Capability.USER_MANAGE);
    
    case 'HR':
    case 'Human Resources':
      return can(user, [Capability.USER_MANAGE, Capability.STAFF_MANAGE]);
    
    case 'Finance':
    case 'Financial Officer':
      return can(user, Capability.FINANCE_VIEW);
    
    case 'Principal':
      return isRole(user, RoleKey.PRINCIPAL) || can(user, Capability.SCHOOL_MANAGE);
    
    case 'Teacher':
      return isRole(user, RoleKey.TEACHER) || can(user, Capability.MEETING_PARTICIPATE);
    
    case 'Support Staff':
      return isRole(user, RoleKey.SUPPORT_STAFF);
    
    // For any unrecognized role title, check if user has the role key directly
    default:
      // Try to match against RoleKey enum values
      const roleKeys = Object.values(RoleKey);
      const matchingRoleKey = roleKeys.find(key => key === roleTitle);
      if (matchingRoleKey) {
        return isRole(user, matchingRoleKey as RoleKey);
      }
      
      // Fallback: return false for unknown roles (secure by default)
      return false
  }
}

// Filter object fields based on read access
export function filterFields<T extends Record<string, unknown>>(
  user: User | AuthenticatedUser,
  model: string,
  data: T,
  record?: Record<string, unknown>
): Partial<T> {
  const filtered: Partial<T> = {};

  for (const [field, value] of Object.entries(data)) {
    if (canReadField(user, model, field, record)) {
      filtered[field as keyof T] = value;
    }
  }

  return filtered;
}

// Validate write operation
export function validateWrite<T extends Record<string, unknown>>(
  user: User | AuthenticatedUser,
  model: string,
  data: T,
  record?: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of Object.keys(data)) {
    if (!canWriteField(user, model, field, record)) {
      errors.push(`You do not have permission to modify field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Apply field-level filtering to Prisma query results
export function applyFieldFiltering<T extends Record<string, unknown>>(
  user: User | AuthenticatedUser,
  model: string,
  data: T | T[]
): T | T[] {
  if (Array.isArray(data)) {
    return data.map(item => filterFields(user, model, item, item) as T);
  }
  return filterFields(user, model, data, data) as T;
}
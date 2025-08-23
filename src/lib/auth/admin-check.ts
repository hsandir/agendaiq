/**
 * Centralized admin check utility
 * Checks if a user has admin privileges based on:
 * 1. is_admin flag in user table
 * 2. Role priority = 1 (highest priority)
 * 3. Role level = 0 (system level)
 */

import { isRole, RoleKey } from '@/lib/auth/policy';

interface UserWithStaff {
  is_admin?: boolean;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  Staff?: Array<{
    Role?: {
      title?: string;
      key?: string;
      priority?: number;
      level?: number;
      is_leadership?: boolean;
    };
  }>;
}

export function isUserAdmin(user: UserWithStaff | null | undefined): boolean {
  if (!user) return false;
  
  // Check new admin flags first - these are the primary indicators
  if (user.is_system_admin ?? user?.is_school_admin) return true;
  
  // Legacy check for backward compatibility
  if (user?.is_admin) return true;
  
  // Prefer canonical RoleKey checks; fall back to flags already handled above
  if (isRole(user as any, RoleKey.DEV_ADMIN) || isRole(user as any, RoleKey.OPS_ADMIN)) return true;
  return false;
}

export function isUserLeadership(user: UserWithStaff | null | undefined): boolean {
  if (!user) return false;
  
  // Admin is also leadership
  if (isUserAdmin(user)) return true;
  
  // Leadership should be driven by capability/role key, not title
  // Treat Ops Admin and Dev Admin as leadership for UI gates
  if (isUserAdmin(user)) return true;
  // If role carries leadership flag, allow
  return !!user.staff?.[0]?.role?.is_leadership;
}
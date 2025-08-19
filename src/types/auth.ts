/**
 * Type definitions for authentication and user management
 * These interfaces ensure type safety across the application
 */

// Base User interface matching Prisma schema
export interface UserWithAuth {
  id: string;
  email: string;
  name: string | null;
  hashedPassword?: string | null;
  emailVerified?: Date | null;
  two_factor_enabled?: boolean;
  two_factor_secret?: string | null;
  backup_codes?: string[];
  is_admin?: boolean;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  staff_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

// Role information
export interface RoleInfo {
  id: number;
  title: string;
  key?: string;
  priority?: number;
  level?: number;
  is_leadership?: boolean;
}

// Department information
export interface DepartmentInfo {
  id: number;
  name: string;
  code?: string;
}

// School information
export interface SchoolInfo {
  id: number;
  name: string;
  code?: string;
  address?: string;
  district_id: number;
}

// Staff with role information
export interface StaffWithRole {
  id: number;
  user_id: number;
  role_id: number;
  department_id?: number | null;
  school_id?: number | null;
  Role?: RoleInfo;
  Department?: DepartmentInfo | null;
  School?: SchoolInfo | null;
  User?: UserWithAuth;
}

// User with staff information
export interface UserWithStaff extends UserWithAuth {
  Staff?: StaffWithRole[] | null;
}

// Authenticated user in session
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  capabilities?: string[];
  staff?: StaffWithRole | null;
}

// Session user interface
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  capabilities?: string[];
  staff?: StaffWithRole;
}

// JWT Token interface
export interface JWTToken {
  id?: string;
  email?: string;
  name?: string | null;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  capabilities?: string[];
  staff?: StaffWithRole;
  rememberMe?: boolean;
  trustDevice?: boolean;
  exp?: number;
}

/**
 * Type Guards for runtime type checking
 */

// Check if user has password
export function isUserWithPassword(user: any): user is UserWithAuth & { hashedPassword: string } {
  return user && 
         typeof user === 'object' && 
         'hashedPassword' in user && 
         typeof user.hashedPassword === 'string' &&
         user.hashedPassword.length > 0;
}

// Check if user has staff
export function isUserWithStaff(user: any): user is UserWithStaff {
  return user && 
         typeof user === 'object' && 
         'Staff' in user && 
         Array.isArray(user.Staff) &&
         user.Staff.length > 0;
}

// Check if user is admin
export function isUserAdmin(user: any): boolean {
  if (!user || typeof user !== 'object') return false;
  
  // Check admin flags
  if (user.is_system_admin || user.is_school_admin || user.is_admin) {
    return true;
  }
  
  // Check role-based admin
  if (isUserWithStaff(user)) {
    const role = user.Staff[0]?.Role;
    if (role) {
      // Admin roles have priority 0 or 1 and level 0
      return (role.priority === 0 || role.priority === 1) && role.level === 0;
    }
  }
  
  return false;
}

// Check if user has specific capability
export function hasCapability(user: any, capability: string): boolean {
  if (!user || typeof user !== 'object') return false;
  
  // System admin has all capabilities
  if (user.is_system_admin) return true;
  
  // School admin has all ops capabilities
  if (user.is_school_admin && capability.startsWith('ops:')) return true;
  
  // Check capabilities array
  if (Array.isArray(user.capabilities)) {
    return user.capabilities.includes(capability);
  }
  
  return false;
}

// Check if object has staff property
export function hasStaff(obj: any): obj is { staff: StaffWithRole } {
  return obj && 
         typeof obj === 'object' && 
         'staff' in obj && 
         obj.staff !== null &&
         typeof obj.staff === 'object';
}

// Safe property access helper
export function safeAccess<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key];
}

// Type assertion with validation
export function assertUser(user: any): asserts user is UserWithAuth {
  if (!user || typeof user !== 'object') {
    throw new Error('Invalid user object');
  }
  if (!user.id || !user.email) {
    throw new Error('User missing required fields');
  }
}

// Type assertion for staff
export function assertStaff(staff: any): asserts staff is StaffWithRole {
  if (!staff || typeof staff !== 'object') {
    throw new Error('Invalid staff object');
  }
  if (!staff.id || !staff.user_id || !staff.role_id) {
    throw new Error('Staff missing required fields');
  }
}
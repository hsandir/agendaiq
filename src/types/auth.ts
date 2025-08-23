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
  key?: string;
  title?: string; // legacy optional
  priority?: number; // legacy optional
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
export function isUserWithPassword(user: unknown): user is UserWithAuth & { hashedPassword: string } {
  return user !== null && user !== undefined && 
         typeof user === 'object' && 
         'hashedPassword' in user && 
         typeof (user as any).hashedPassword === 'string' &&
         (user as any).hashedPassword.length > 0;
}

// Check if user has staff
export function isUserWithStaff(user: unknown): user is UserWithStaff {
  return user !== null && user !== undefined && 
         typeof user === 'object' && 
         'Staff' in user && 
         Array.isArray((user as any).Staff) &&
         (user as any).staff.length > 0;
}

// Check if user is admin
export function isUserAdmin(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  
  const userObj = user as any;
  
  // Check admin flags
  if (userObj.is_system_admin || userObj.is_school_admin || userObj.is_admin) {
    return true;
  }
  
  // Check role-based admin
  if (isUserWithStaff(user) && user.staff?.[0]?.Role) {
    // Do not infer admin via title/priority; rely on flags/capabilities
    return false;
  }
  
  return false;
}

// Check if user has specific capability
export function hasCapability(user: unknown, capability: string): boolean {
  if (!user || typeof user !== 'object') return false;
  
  const userObj = user as any;
  
  // System admin has all capabilities
  if (userObj.is_system_admin) return true;
  
  // School admin has all ops capabilities
  if (userObj.is_school_admin && capability.startsWith('ops:')) return true;
  
  // Check capabilities array
  if (Array.isArray(userObj.capabilities)) {
    return userObj.capabilities.includes(capability);
  }
  
  return false;
}

// Check if object has staff property
export function hasStaff(obj: unknown): obj is { staff: StaffWithRole } {
  return obj !== null && obj !== undefined && 
         typeof obj === 'object' && 
         'staff' in obj && 
         (obj as any).staff !== null &&
         typeof (obj as any).staff === 'object';
}

// Safe property access helper
export function safeAccess<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key];
}

// Type assertion with validation
export function assertUser(user: unknown): asserts user is UserWithAuth {
  if (!user || typeof user !== 'object') {
    throw new Error('Invalid user object');
  }
  const userObj = user as any;
  if (!userObj.id || !userObj.email) {
    throw new Error('User missing required fields');
  }
}

// Type assertion for staff
export function assertStaff(staff: unknown): asserts staff is StaffWithRole {
  if (!staff || typeof staff !== 'object') {
    throw new Error('Invalid staff object');
  }
  const staffObj = staff as any;
  if (!staffObj.id || !staffObj.user_id || !staffObj.role_id) {
    throw new Error('Staff missing required fields');
  }
}
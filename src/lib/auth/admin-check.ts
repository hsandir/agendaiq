/**
 * Centralized admin check utility
 * Checks if a user has admin privileges based on:
 * 1. is_admin flag in user table
 * 2. Role priority = 1 (highest priority)
 * 3. Role level = 0 (system level)
 */

interface UserWithStaff {
  is_admin?: boolean;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  Staff?: Array<{
    Role?: {
      title: string;
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
  if user.is_system_admin || (user as Record<string, unknown>.is_school_admin) return true;
  
  // Legacy check for backward compatibility
  if (user.is_admin) return true;
  
  // Check role properties
  const role = user.Staff?.[0]?.Role;
  if (!role) return false;
  
  // Check for admin role keys
  if (role.key === 'DEV_ADMIN' || role.key === 'OPS_ADMIN') {
    return true;
  }
  
  // Admin roles have priority 0 or 1 and level 0
  return (role.priority === 0 || role.priority === 1) && role.level === 0;
}

export function isUserLeadership(user: UserWithStaff | null | undefined): boolean {
  if (!user) return false;
  
  // Admin is also leadership
  if (isUserAdmin(user)) return true;
  
  // Check if role is leadership role
  const roleTitle = user.Staff?.[0]?.Role?.title;
  const leadershipRoles = [
    "Chief Education Officer",
    "Director of Operations", 
    "Business Administrator",
    "Assistant Business Administrator",
    "Director of Curriculum - Humanities",
    "Director of Curriculum - STEM",
    "Supervisors - Curriculum/Professional Development",
    "Director of Accountability",
    "Director of Student Support Services",
    "Assistant Director of Student Support Services",
    "Director of Special Education"
  ];
  
  return leadershipRoles.includes(roleTitle || "");
}
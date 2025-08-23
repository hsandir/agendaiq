/**
 * FULL DYNAMIC RBAC SYSTEM
 * Database schema'ya uygun, tam fonksiyonellik ile
 */

import { AuthenticatedUser as _AuthenticatedUser } from '../auth/auth-utils';
import { prisma } from '../prisma';
import { Capability, RoleKey, can, isRole } from '@/lib/auth/policy';

// Enhanced RBAC system interfaces
export interface AccessContext {
  user: _AuthenticatedUser;
  resource: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export interface AccessResult {
  granted: boolean;
  reason: string;
  appliedRules: string[];
  context: AccessContext;
  timestamp: Date;
}

export interface RolePermission {
  id: string;
  roleId: number;
  resource: string;
  action: string;
  scope?: 'own' | 'department' | 'school' | 'district' | 'all';
  priority: number;
  granted: boolean;
  conditions?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Staff with role relation type
interface StaffWithRole {
  id: number;
  user_id: number;
  school_id: number;
  department_id: number;
  Role: {
    id: number;
    department_id?: number;
  };
  School: {
    id: number;
    name: string;
  };
  Department: {
    id: number;
    name: string;
  };
}

export class DynamicRBAC {
  private static instance: DynamicRBAC;
  private permissionsCache = new Map<string, RolePermission[]>();
  private staffCache = new Map<number, StaffWithRole[]>();
  private roleHierarchyCache = new Map<string, string[]>();
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  static getInstance(): DynamicRBAC {
    if (!DynamicRBAC.instance) {
      DynamicRBAC.instance = new DynamicRBAC();
    }
    return DynamicRBAC.instance;
  }

  // Clear cache
  clearCache(): void {
    this.permissionsCache.clear();
    this.staffCache.clear();
    this.roleHierarchyCache.clear();
    this.cacheTimestamp = 0;
  }

  // Check if cache is still valid
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  // Check if user has access to perform action on resource
  async checkAccess(context: AccessContext): Promise<AccessResult> {
    try {
      // Load user staff records
      const userStaff = await this.getUserStaff(context.user);
      const appliedRules: string[] = [];
      
      if (!userStaff || userStaff.length === 0) {
        return {
          granted: false,
          reason: 'User is not staff member',
          appliedRules,
          context,
          timestamp: new Date()
        };
      }

      // Check each staff role for permissions
      for (const staff of userStaff) {
        // Check direct role permissions
        const directAccess = await this.checkDirectRolePermissions(
          context.user,
          staff.Role,
          context.resource,
          context.action
        );
        
        if (directAccess.granted) {
          appliedRules.push(`direct_role_${staff.Role.id}`);
          return {
            granted: true,
            reason: `Access granted through role id: ${staff.Role.id}`,
            appliedRules,
            context,
            timestamp: new Date()
          };
        }

        // Check inherited permissions from role hierarchy
        const inheritedAccess = await this.checkInheritedPermissions(
          staff.Role,
          context.resource,
          context.action
        );

        if (inheritedAccess.granted) {
          appliedRules.push(`inherited_role_${staff.Role.id}`);
          return {
            granted: true,
            reason: `Access granted through role hierarchy: ${inheritedAccess.reason}`,
            appliedRules,
            context,
            timestamp: new Date()
          };
        }

        // Check context-based permissions
        const contextAccess = await this.checkContextualPermissions(context, staff);
        
        if (contextAccess.granted) {
          appliedRules.push(`contextual_role_${staff.Role.id}`);
          return {
            granted: true,
            reason: `Access granted through context: ${contextAccess.reason}`,
            appliedRules,
            context,
            timestamp: new Date()
          };
        }
      }

      return {
        granted: false,
        reason: 'No matching permissions found',
        appliedRules,
        context,
        timestamp: new Date()
      };

    } catch (error: unknown) {
      console.error('Error checking access:', error);
      return {
        granted: false,
        reason: 'Error during access check',
        appliedRules: [],
        context,
        timestamp: new Date()
      };
    }
  }

  // Get user staff records with roles
  async getUserStaff(user: _AuthenticatedUser): Promise<StaffWithRole[]> {
    // Safely convert user.id to number
    const userId = typeof user.id === 'string' ? parseInt(user.id) : Number(user.id);
    if (isNaN(userId)) {
      console.warn('Invalid user ID for staff lookup:', user.id);
      return [];
    }

    const cacheKey = `user_staff_${userId}`;
    
    // Check cache first
    if (this.isCacheValid() && this.staffCache.has(userId)) {
      return this.staffCache.get(userId)!;
    }

    try {
      const staffRecords = await prisma.staff.findMany({
        where: { user_id: userId },
        include: {
          Role: {
            select: {
              id: true,
              department_id: true
            }
          },
          School: {
            select: {
              id: true,
              name: true
            }
          },
          Department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Type conversion for compatibility
      const typedStaffRecords: StaffWithRole[] = staffRecords.map(record => ({
        id: record.id,
        user_id: record.user_id,
        school_id: record.school_id,
        department_id: record.department_id,
        Role: {
          id: record.Role.id,
          department_id: record.Role.department_id ?? undefined
        },
        School: {
          id: record.School.id,
          name: record.School.name
        },
        Department: {
          id: record.Department.id,
          name: record.Department.name
        }
      }));

      // Cache the results
      this.staffCache.set(userId, typedStaffRecords);
      this.cacheTimestamp = Date.now();
      
      return typedStaffRecords;

    } catch (error: unknown) {
      console.error('Error getting user staff records:', error);
      return [];
    }
  }

  // Check direct role permissions
  private async checkDirectRolePermissions(
    user: _AuthenticatedUser,
    role: StaffWithRole['Role'],
    resource: string,
    action: string
  ): Promise<{ granted: boolean; reason?: string }> {
    // Check built-in role permissions based on role properties
    
    // Administrator access via canonical RoleKey/capabilities
    if (user && (isRole(user as any, RoleKey.OPS_ADMIN) || isRole(user as any, RoleKey.DEV_ADMIN))) {
      if (this.isAdministrativeResource(resource)) {
        return { granted: true, reason: 'Admin access via RoleKey' };
      }
    }

    // Capability-based elevation
    if (this.isHighPriorityResource(resource, action) && can(user as any, Capability.USER_MANAGE)) {
      return { granted: true, reason: 'Capability USER_MANAGE access' };
    }

    // Role-specific permissions replaced with capability mapping
    const rolePermissions = this.getRoleBasedPermissions(user, resource, action);
    if (rolePermissions.granted) {
      return rolePermissions;
    }

    return { granted: false, reason: 'No direct role permissions' };
  }

  // Check inherited permissions from role hierarchy
  private async checkInheritedPermissions(
    role: StaffWithRole['Role'],
    resource: string,
    action: string
  ): Promise<{ granted: boolean; reason?: string }> {
    try {
      // Get parent roles in hierarchy
      const parentRoles = await this.getParentRoles(role.id.toString());
      
      for (const parentRoleId of parentRoles) {
        // Get parent role details
        const parentRole = await prisma.role.findUnique({
          where: { id: parseInt(parentRoleId) },
          select: {
            id: true,
            department_id: true
          }
        });

        if (parentRole) {
          // Convert null to undefined for type compatibility
          const roleWithConvertedDeptId = {
            ...parentRole,
            department_id: parentRole.department_id ?? undefined
          };
          
          const parentAccess = await this.checkDirectRolePermissions(({} as any), roleWithConvertedDeptId, resource, action);
          
          if (parentAccess.granted) {
            return { 
              granted: true, 
              reason: `Inherited from parent role id: ${parentRole.id}` 
            };
          }
        }
      }

      return { granted: false, reason: 'No inherited permissions found' };

    } catch (error: unknown) {
      console.error('Error checking inherited permissions:', error);
      return { granted: false, reason: 'Error checking inheritance' };
    }
  }

  // Check contextual permissions (e.g., own data access, department access)
  private async checkContextualPermissions(
    context: AccessContext, 
    staff: StaffWithRole
  ): Promise<{ granted: boolean; reason?: string }> {
    
    // Users can always access their own data
    if (context.resource === 'user' && context.action === 'read' && 
        context.targetId === context.user.id.toString()) {
      return { granted: true, reason: 'Self-access granted' };
    }

    // Staff can access their own staff data
    if (context.resource === 'staff' && context.action === 'read' && 
        context.targetId === staff.id.toString()) {
      return { granted: true, reason: 'Own staff data access' };
    }

    // Department-based access
    if (context.resource === 'meeting' || context.resource === 'department') {
      // Staff can access meetings in their department
      if (context.metadata?.department_id === staff.department_id) {
        return { granted: true, reason: 'Department-based access' };
      }
    }

    // School-based access
    if (context.resource === 'school' || context.resource === 'student') {
      // Staff can access data in their school
      if (context.metadata?.school_id === staff.school_id) {
        return { granted: true, reason: 'School-based access' };
      }
    }

    // Manager-subordinate access
    if (context.action === 'manage' || context.action === 'supervise') {
      // Check if user manages the target staff
      if (context.metadata?.manager_id === staff.id) {
        return { granted: true, reason: 'Manager access to subordinate' };
      }
    }

    return { granted: false, reason: 'No contextual rules apply' };
  }

  // Check if resource is administrative
  private isAdministrativeResource(resource: string): boolean {
    const adminResources = [
      'user_management', 'system', 'security', 'backup', 'database',
      'workflow_management', 'code_modification', 'code_generation'
    ];
    return adminResources.includes(resource);
  }

  // Check if resource/action requires high priority
  private isHighPriorityResource(resource: string, action: string): boolean {
    const highPriorityOperations = [
      { resource: 'staff', action: 'manage' },
      { resource: 'role', action: 'manage' },
      { resource: 'school', action: 'manage' },
      { resource: 'workflow_management', action: 'execute' },
      { resource: 'system', action: 'configure' }
    ];
    
    return highPriorityOperations.some(op => 
      op.resource === resource && op.action === action
    );
  }

  // Get parent roles in hierarchy
  private async getParentRoles(roleId: string): Promise<string[]> {
    const cacheKey = `parents_${roleId}`;
    
    if (this.isCacheValid() && this.roleHierarchyCache.has(cacheKey)) {
      return this.roleHierarchyCache.get(cacheKey)!;
    }

    try {
      // Get role hierarchy relationships
      const hierarchyRecords = await prisma.roleHierarchy.findMany({
        where: { child_role_id: parseInt(roleId) },
        select: { parent_role_id: true }
      });

      const parentIds = hierarchyRecords.map(r => r.parent_role_id.toString());
      
      // Cache results
      this.roleHierarchyCache.set(cacheKey, parentIds);
      
      return parentIds;

    } catch (error: unknown) {
      console.error('Error getting parent roles:', error);
      return [];
    }
  }

  // Get role-based permissions
  private getRoleBasedPermissions(
    user: _AuthenticatedUser,
    resource: string, 
    action: string
  ): { granted: boolean; reason?: string } {
    // Map resource/action to capability checks
    const checks: Array<{ when: boolean; cap: Capability; reason: string }> = [
      { when: resource === 'user' && action === 'manage', cap: Capability.USER_MANAGE, reason: 'USER_MANAGE' },
      { when: resource === 'role' && action === 'manage', cap: Capability.ROLE_MANAGE, reason: 'ROLE_MANAGE' },
      { when: resource === 'school' && action === 'manage', cap: Capability.SCHOOL_MANAGE, reason: 'SCHOOL_MANAGE' },
      { when: resource === 'staff' && action === 'manage', cap: Capability.STAFF_MANAGE, reason: 'STAFF_MANAGE' },
      { when: resource === 'meeting' && action === 'read', cap: Capability.MEETING_VIEW, reason: 'MEETING_VIEW' },
      { when: resource === 'meeting' && action === 'create', cap: Capability.MEETING_CREATE, reason: 'MEETING_CREATE' },
      { when: resource === 'system' && action === 'configure', cap: Capability.OPS_HEALTH, reason: 'OPS_HEALTH' },
      { when: resource === 'security' && action === 'read', cap: Capability.OPS_LOGS, reason: 'OPS_LOGS' }
    ];
    for (const c of checks) {
      if (c.when && can(user as any, c.cap)) return { granted: true, reason: `Capability ${c.reason}` };
    }
    return { granted: false, reason: 'No capability match' };
  }

  // Helper method to check if user has specific permission
  async hasPermission(
    user: _AuthenticatedUser,
    resource: string,
    action: string,
    targetId?: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const context: AccessContext = {
      user,
      resource,
      action,
      targetId,
      metadata
    };

    const result = await this.checkAccess(context);
    return result.granted;
  }

  // Check if user is admin
  async isAdmin(user: _AuthenticatedUser): Promise<boolean> {
    return isRole(user as any, RoleKey.DEV_ADMIN) || isRole(user as any, RoleKey.OPS_ADMIN) || can(user as any, Capability.USER_MANAGE);
  }

  // Get primary staff record for user
  async getPrimaryStaff(user: _AuthenticatedUser): Promise<StaffWithRole | null> {
    const userStaff = await this.getUserStaff(user);
    if (userStaff.length === 0) return null;
    
    // Return highest priority role
    return userStaff.reduce((prev, current) => 
      current.Role.priority > prev.Role.priority ? current : prev
    );
  }

  // Get all roles user has access to
  async getUserRoles(user: _AuthenticatedUser): Promise<string[]> {
    const userStaff = await this.getUserStaff(user);
    return userStaff.map(staff => staff.Role.title);
  }

  // Get user's departments
  async getUserDepartments(user: _AuthenticatedUser): Promise<number[]> {
    const userStaff = await this.getUserStaff(user);
    return [...new Set(userStaff.map(staff => staff.department_id))];
  }

  // Get user's schools
  async getUserSchools(user: _AuthenticatedUser): Promise<number[]> {
    const userStaff = await this.getUserStaff(user);
    return [...new Set(userStaff.map(staff => staff.school_id))];
  }

  // Role hierarchy management
  async getRoleHierarchy(roleId: string): Promise<string[]> {
    const cacheKey = `hierarchy_${roleId}`;
    
    if (this.isCacheValid() && this.roleHierarchyCache.has(cacheKey)) {
      return this.roleHierarchyCache.get(cacheKey)!;
    }

    try {
      // Get all roles in hierarchy (parents and children)
      const parentRoles = await this.getParentRoles(roleId);
      const childRoles = await this.getChildRoles(roleId);
      
      const allRoles = [roleId, ...parentRoles, ...childRoles];
      const uniqueRoles = [...new Set(allRoles)];
      
      // Cache results
      this.roleHierarchyCache.set(cacheKey, uniqueRoles);
      
      return uniqueRoles;

    } catch (error: unknown) {
      console.error('Error getting role hierarchy:', error);
      return [roleId];
    }
  }

  // Get child roles
  private async getChildRoles(roleId: string): Promise<string[]> {
    try {
      const hierarchyRecords = await prisma.roleHierarchy.findMany({
        where: { parent_role_id: parseInt(roleId) },
        select: { child_role_id: true }
      });

      return hierarchyRecords.map(r => r.child_role_id.toString());

    } catch (error: unknown) {
      console.error('Error getting child roles:', error);
      return [];
    }
  }

  // Permission cache management
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const cacheKey = `role_permissions_${roleId}`;
    
    if (this.isCacheValid() && this.permissionsCache.has(cacheKey)) {
      return this.permissionsCache.get(cacheKey)!;
    }

    try {
      // Get role details
      const role = await prisma.role.findUnique({
        where: { id: parseInt(roleId) },
        select: {
          id: true,
          department_id: true
        }
      });

      if (!role) {
        return [];
      }

      // Convert null to undefined for type compatibility
      const roleWithConvertedDeptId = {
        ...role,
        department_id: role.department_id ?? undefined
      };
      
      // Generate permissions based on role
      const permissions = this.generateRolePermissions(roleWithConvertedDeptId);
      
      // Cache results
      this.permissionsCache.set(cacheKey, permissions);
      
      return permissions;

    } catch (error: unknown) {
      console.error('Error getting role permissions:', error);
      return [];
    }
  }

  // Generate permissions based on role
  private generateRolePermissions(role: StaffWithRole['Role']): RolePermission[] {
    const permissions: RolePermission[] = [];
    const now = new Date();

    // Base permissions for all roles (no title/priority heuristics)
    permissions.push({
      id: `${role.id}_read_own`,
      roleId: role.id,
      resource: 'user',
      action: 'read',
      scope: 'own',
      priority: 1,
      granted: true,
      createdAt: now,
      updatedAt: now
    });

    return permissions;
  }
} 
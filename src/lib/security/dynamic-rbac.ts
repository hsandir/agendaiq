/**
 * DYNAMIC ROLE-BASED ACCESS CONTROL SYSTEM
 * 
 * Bu sistem:
 * 1. Rol bazlı erişim kontrolü yapar
 * 2. Hiyerarşik rol yapısını destekler
 * 3. Context-aware permissions sağlar
 * 4. Cache ile performans optimizasyonu yapar
 */

import { AuthenticatedUser } from '../auth/auth-utils';
import { prisma } from '../prisma';

export interface RolePermission {
  id: string;
  roleId: string;
  resource: string;
  action: string;
  scope?: string;
  conditions?: Record<string, unknown>;
  priority: number;
  granted: boolean;
  created_at: Date;
  updated_at: Date;
}

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

export interface RoleHierarchy {
  roleId: string;
  parentRoleId?: string;
  level: number;
  priority: number;
  inheritsPermissions: boolean;
}

// ===== DYNAMIC RBAC CLASS =====

export class DynamicRBAC {
  private static instance: DynamicRBAC;
  private permissionsCache = new Map<string, RolePermission[]>();
  private hierarchyCache = new Map<string, RoleHierarchy>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  static getInstance(): DynamicRBAC {
    if (!DynamicRBAC.instance) {
      DynamicRBAC.instance = new DynamicRBAC();
    }
    return DynamicRBAC.instance;
  }

  // Check if user has access to perform action on resource
  async checkAccess(context: AccessContext): Promise<AccessResult> {
    try {
      // Load user permissions
      const userPermissions = await this.getUserPermissions(context.user);
      const appliedRules: string[] = [];
      
      // Check direct permissions
      const directAccess = this.checkDirectPermissions(
        userPermissions, 
        context.resource, 
        context.action
      );
      
      if (directAccess.granted) {
        appliedRules.push('direct_permission');
        return {
          granted: true,
          reason: 'Direct permission granted',
          appliedRules,
          context,
          timestamp: new Date()
        };
      }

      // Check inherited permissions from role hierarchy
      const inheritedAccess = await this.checkInheritedPermissions(
        context.user,
        context.resource,
        context.action
      );

      if (inheritedAccess.granted) {
        appliedRules.push('inherited_permission');
        return {
          granted: true,
          reason: 'Inherited permission granted',
          appliedRules,
          context,
          timestamp: new Date()
        };
      }

      // Check context-based permissions
      const contextAccess = await this.checkContextualPermissions(context);
      
      if (contextAccess.granted) {
        appliedRules.push('contextual_permission');
        return {
          granted: true,
          reason: 'Contextual permission granted',
          appliedRules,
          context,
          timestamp: new Date()
        };
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

  // Get all permissions for a user
  async getUserPermissions(user: _AuthenticatedUser): Promise<RolePermission[]> {
    const cacheKey = `user_permissions_${user.id}`;
    
    // Check cache first
    if (this.isCacheValid() && this.permissionsCache.has(cacheKey)) {
      return this.permissionsCache.get(cacheKey)!;
    }

    try {
      // Get user's staff record with role
      const staff = await prisma.staff.findFirst({
        where: { user_id: user.id },
        include: {
          role: true
        }
      });

      if (!staff?.Role) {
        return [];
      }

      // Get all role IDs in hierarchy
      const roleIds = await this.getRoleHierarchy(staff.role.id.toString());
      
      // Get permissions for all roles
      const permissions: RolePermission[] = [];
      
      for (const roleId of roleIds) {
        const rolePermissions = await this.getRolePermissions(roleId);
        permissions.push(...rolePermissions);
      }

      // Cache the results
      this.permissionsCache.set(cacheKey, permissions);
      
      return permissions;

    } catch (error: unknown) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // Check direct permissions
  private checkDirectPermissions(
    permissions: RolePermission[],
    resource: string,
    action: string
  ): { granted: boolean; permission?: RolePermission } {
    const matchingPermissions = permissions.filter(p => 
      p.resource === resource && 
      p.action === action &&
      p.granted
    );

    if (matchingPermissions.length > 0) {
      // Return highest priority permission
      const permission = matchingPermissions.reduce((prev, current) => 
        current.priority > prev.priority ? current : prev
      );
      return { granted: true, permission };
    }

    return { granted: false };
  }

  // Check inherited permissions from role hierarchy
  private async checkInheritedPermissions(
    user: _Authenticatedusers,
    resource: string,
    action: string
  ): Promise<{ granted: boolean; reason?: string }> {
    try {
      // Get user's role hierarchy
      const staff = await prisma.staff.findFirst({
        where: { user_id: user.id },
        include: { role: true }
      });

      if (!staff?.Role) {
        return { granted: false, reason: 'No role found' };
      }

      // Get parent roles
      const parentRoles = await this.getParentRoles(staff.role.id.toString());
      
      for (const parentRoleId of parentRoles) {
        const parentPermissions = await this.getRolePermissions(parentRoleId);
        const access = this.checkDirectPermissions(parentPermissions, resource, action);
        
        if (access.granted) {
          return { granted: true, reason: `Inherited from parent role ${parentRoleId}` };
        }
      }

      return { granted: false, reason: 'No inherited permissions found' };

    } catch (error: unknown) {
      console.error('Error checking inherited permissions:', error);
      return { granted: false, reason: 'Error checking inheritance' };
    }
  }

  // Check contextual permissions (e.g., own data access)
  private async checkContextualPermissions(context: AccessContext): Promise<{ granted: boolean; reason?: string }> {
    // Example: Users can always access their own data
    if (context.resource === 'user' && context.action === 'read' && context.targetId === context.user.id.toString()) {
      return { granted: true, reason: 'Self-access granted' };
    }

    // Example: Staff can access their own meetings
    if (context.resource === 'meeting' && context.action === 'read') {
      // Check if user is organizer or participant
      // This would require additional database queries
      return { granted: false, reason: 'Meeting access rules not implemented' };
    }

    return { granted: false, reason: 'No contextual rules apply' };
  }

  // Get role hierarchy (including self)
  private async getRoleHierarchy(roleId: string): Promise<string[]> {
    const roleIds = [roleId];
    
    try {
      // Get all child roles
      const childRoles = await this.getChildRoles(roleId);
      roleIds.push(...childRoles);
      
      return roleIds;
    } catch (error: unknown) {
      console.error('Error getting role hierarchy:', error);
      return roleIds;
    }
  }

  // Get child roles recursively
  private async getChildRoles(roleId: string): Promise<string[]> {
    const childRoles: string[] = [];
    
    try {
      const hierarchy = await prisma.role_hierarchy.findMany({
        where: { parent_role_id: parseInt(roleId) }
      });

      for (const child of hierarchy) {
        childRoles.push(child.child_role_id.toString());
        // Recursively get children of children
        const grandChildren = await this.getChildRoles(child.child_role_id.toString());
        childRoles.push(...grandChildren);
      }
    } catch (error: unknown) {
      console.error('Error getting child roles:', error);
    }

    return childRoles;
  }

  // Get parent roles recursively
  private async getParentRoles(roleId: string): Promise<string[]> {
    const parentRoles: string[] = [];
    
    try {
      const hierarchy = await prisma.role_hierarchy.findMany({
        where: { child_role_id: parseInt(roleId) }
      });

      for (const parent of hierarchy) {
        parentRoles.push(parent.parent_role_id.toString());
        // Recursively get parents of parents
        const grandParents = await this.getParentRoles(parent.parent_role_id.toString());
        parentRoles.push(...grandParents);
      }
    } catch (error: unknown) {
      console.error('Error getting parent roles:', error);
    }

    return parentRoles;
  }

  // Get permissions for a specific role
  private async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    try {
      // In a real implementation, this would query a permissions table
      // For now, return mock permissions based on role
      return this.getMockPermissions(roleId);
    } catch (error: unknown) {
      console.error('Error getting role permissions:', error);
      return [];
    }
  }

  // Mock permissions for development
  private getMockPermissions(roleId: string): RolePermission[] {
    const basePermissions: RolePermission[] = [
      {
        id: `${roleId}_read_own`,
        roleId,
        resource: 'user',
        action: 'read',
        scope: 'own',
        priority: 1,
        granted: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: `${roleId}_update_own`,
        roleId,
        resource: 'user',
        action: 'update',
        scope: 'own',
        priority: 1,
        granted: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Add role-specific permissions
    if (roleId.includes('admin') || roleId.includes('Administrator')) {
      basePermissions.push(
        {
          id: `${roleId}_admin_all`,
          roleId,
          resource: '*',
          action: '*',
          priority: 10,
          granted: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      );
    }

    return basePermissions;
  }

  // Check if cache is still valid
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  // Clear cache
  clearCache(): void {
    this.permissionsCache.clear();
    this.hierarchyCache.clear();
    this.lastCacheUpdate = 0;
  }

  // Refresh cache
  async refreshCache(): Promise<void> {
    this.clearCache();
    this.lastCacheUpdate = Date.now();
  }

  // Helper method to check if user has specific permission
  async hasPermission(
    user: _Authenticatedusers,
    resource: string,
    action: string,
    targetId?: string
  ): Promise<boolean> {
    const context: AccessContext = {
      user,
      resource,
      action,
      targetId
    };

    const result = await this.checkAccess(context);
    return result.granted;
  }

  // Helper method to check if user is admin
  async isAdmin(user: _AuthenticatedUser): Promise<boolean> {
    return await this.hasPermission(user, '*', '*');
  }

  // Helper method to check if user is staff
  async isStaff(user: _AuthenticatedUser): Promise<boolean> {
    try {
      const staff = await prisma.staff.findFirst({
        where: { user_id: user.id }
      });
      return !!staff;
    } catch (error: unknown) {
      console.error('Error checking staff status:', error);
      return false;
    }
  }
} 
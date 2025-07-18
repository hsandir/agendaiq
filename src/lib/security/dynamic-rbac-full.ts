/**
 * FULL DYNAMIC RBAC SYSTEM
 * Database schema'ya uygun, tam fonksiyonellik ile
 */

import { AuthenticatedUser } from '../auth/auth-utils';
import { prisma } from '../prisma';

export interface RolePermission {
  id: string;
  roleId: number;
  resource: string;
  action: string;
  scope?: string;
  conditions?: Record<string, any>;
  priority: number;
  granted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessContext {
  user: AuthenticatedUser;
  resource: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

export interface AccessResult {
  granted: boolean;
  reason: string;
  appliedRules: string[];
  context: AccessContext;
  timestamp: Date;
}

export interface StaffWithRole {
  id: number;
  user_id: number;
  department_id: number;
  role_id: number;
  manager_id: number | null;
  school_id: number;
  district_id: number;
  Role: {
    id: number;
    title: string;
    priority: number;
    level: number;
    is_leadership: boolean;
    parent_id: number | null;
  };
  Department: {
    id: number;
    name: string;
    code: string;
  };
  School: {
    id: number;
    name: string;
  };
  District: {
    id: number;
    name: string;
  };
}

export class DynamicRBAC {
  private static instance: DynamicRBAC;
  private permissionsCache = new Map<string, RolePermission[]>();
  private staffCache = new Map<number, StaffWithRole[]>();
  private hierarchyCache = new Map<number, number[]>();
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
          staff.Role,
          context.resource,
          context.action
        );
        
        if (directAccess.granted) {
          appliedRules.push(`direct_role_${staff.Role.title}`);
          return {
            granted: true,
            reason: `Access granted through role: ${staff.Role.title}`,
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
          appliedRules.push(`inherited_${staff.Role.title}`);
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
          appliedRules.push(`contextual_${staff.Role.title}`);
          return {
            granted: true,
            reason: `Contextual access granted: ${contextAccess.reason}`,
            appliedRules,
            context,
            timestamp: new Date()
          };
        }
      }

      return {
        granted: false,
        reason: 'No matching permissions found for any staff roles',
        appliedRules,
        context,
        timestamp: new Date()
      };

    } catch (error) {
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

  // Get user's staff records with role information
  async getUserStaff(user: AuthenticatedUser): Promise<StaffWithRole[]> {
    const cacheKey = `user_staff_${user.id}`;
    
    // Check cache first
    if (this.isCacheValid() && this.staffCache.has(parseInt(user.id))) {
      return this.staffCache.get(parseInt(user.id))!;
    }

    try {
      const staffRecords = await prisma.staff.findMany({
        where: { user_id: parseInt(user.id) },
        include: {
          Role: {
            select: {
              id: true,
              title: true,
              priority: true,
              level: true,
              is_leadership: true,
              parent_id: true
            }
          },
          Department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          School: {
            select: {
              id: true,
              name: true
            }
          },
          District: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Cache the results
      this.staffCache.set(parseInt(user.id), staffRecords as StaffWithRole[]);
      
      return staffRecords as StaffWithRole[];

    } catch (error) {
      console.error('Error getting user staff records:', error);
      return [];
    }
  }

  // Check direct role permissions
  private async checkDirectRolePermissions(
    role: StaffWithRole['Role'],
    resource: string,
    action: string
  ): Promise<{ granted: boolean; reason?: string }> {
    // Check built-in role permissions based on role properties
    
    // Administrator/Leadership roles get broad access
    if (role.is_leadership || role.title.toLowerCase().includes('administrator')) {
      if (this.isAdministrativeResource(resource)) {
        return { granted: true, reason: 'Leadership role administrative access' };
      }
    }

    // High priority roles get elevated access
    if (role.priority >= 8) {
      if (this.isHighPriorityResource(resource, action)) {
        return { granted: true, reason: 'High priority role access' };
      }
    }

    // Role-specific permissions
    const rolePermissions = this.getRoleBasedPermissions(role.title, resource, action);
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
      // Get parent roles from hierarchy
      const parentRoles = await this.getParentRoles(role.id);
      
      for (const parentRoleId of parentRoles) {
        const parentRole = await prisma.role.findUnique({
          where: { id: parentRoleId },
          select: {
            id: true,
            title: true,
            priority: true,
            level: true,
            is_leadership: true,
            parent_id: true
          }
        });

        if (parentRole) {
          const parentAccess = await this.checkDirectRolePermissions(
            parentRole,
            resource,
            action
          );
          
          if (parentAccess.granted) {
            return { 
              granted: true, 
              reason: `Inherited from parent role: ${parentRole.title}` 
            };
          }
        }
      }

      return { granted: false, reason: 'No inherited permissions found' };

    } catch (error) {
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
        context.targetId === context.user.id) {
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

  // Get parent roles recursively
  private async getParentRoles(roleId: number): Promise<number[]> {
    const cacheKey = `parent_roles_${roleId}`;
    
    if (this.hierarchyCache.has(roleId)) {
      return this.hierarchyCache.get(roleId)!;
    }

    const parentRoles: number[] = [];
    
    try {
      // Get direct parent from role table
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: { parent_id: true }
      });

      if (role?.parent_id) {
        parentRoles.push(role.parent_id);
        // Recursively get parents of parents
        const grandParents = await this.getParentRoles(role.parent_id);
        parentRoles.push(...grandParents);
      }

      // Also check role hierarchy table
      const hierarchyRelations = await prisma.roleHierarchy.findMany({
        where: { child_role_id: roleId },
        select: { parent_role_id: true }
      });

      for (const relation of hierarchyRelations) {
        if (!parentRoles.includes(relation.parent_role_id)) {
          parentRoles.push(relation.parent_role_id);
          // Recursively get parents of hierarchy parents
          const hierarchyParents = await this.getParentRoles(relation.parent_role_id);
          parentRoles.push(...hierarchyParents.filter(p => !parentRoles.includes(p)));
        }
      }

      // Cache the results
      this.hierarchyCache.set(roleId, parentRoles);
      
    } catch (error) {
      console.error('Error getting parent roles:', error);
    }

    return parentRoles;
  }

  // Check if resource requires administrative access
  private isAdministrativeResource(resource: string): boolean {
    const adminResources = [
      'user_management',
      'role_management', 
      'system_settings',
      'district',
      'school_administration',
      'staff_management',
      'department_management'
    ];
    return adminResources.includes(resource);
  }

  // Check if resource/action requires high priority access
  private isHighPriorityResource(resource: string, action: string): boolean {
    const highPriorityActions = ['delete', 'create', 'manage', 'admin'];
    const highPriorityResources = ['budget', 'personnel', 'curriculum', 'assessment'];
    
    return highPriorityActions.includes(action) || highPriorityResources.includes(resource);
  }

  // Get role-based permissions
  private getRoleBasedPermissions(
    roleTitle: string, 
    resource: string, 
    action: string
  ): { granted: boolean; reason?: string } {
    const roleLower = roleTitle.toLowerCase();

    // Superintendent permissions
    if (roleLower.includes('superintendent')) {
      return { granted: true, reason: 'Superintendent full access' };
    }

    // Principal permissions
    if (roleLower.includes('principal')) {
      const principalResources = [
        'school', 'staff', 'student', 'meeting', 'curriculum', 
        'budget', 'discipline', 'parent_communication'
      ];
      if (principalResources.includes(resource)) {
        return { granted: true, reason: 'Principal school-level access' };
      }
    }

    // Department Head permissions
    if (roleLower.includes('department') && roleLower.includes('head')) {
      const deptResources = ['department', 'curriculum', 'staff', 'meeting', 'budget'];
      if (deptResources.includes(resource)) {
        return { granted: true, reason: 'Department Head access' };
      }
    }

    // Teacher permissions
    if (roleLower.includes('teacher')) {
      const teacherResources = ['meeting', 'student', 'curriculum', 'assessment'];
      const teacherActions = ['read', 'create', 'update'];
      if (teacherResources.includes(resource) && teacherActions.includes(action)) {
        return { granted: true, reason: 'Teacher classroom access' };
      }
    }

    // IT Staff permissions
    if (roleLower.includes('it')) {
      const itResources = ['system', 'technology', 'user_management', 'security'];
      if (itResources.includes(resource)) {
        return { granted: true, reason: 'IT staff technical access' };
      }
    }

    return { granted: false, reason: 'No role-based permissions match' };
  }

  // Helper method to check if user has specific permission
  async hasPermission(
    user: AuthenticatedUser,
    resource: string,
    action: string,
    targetId?: string,
    metadata?: Record<string, any>
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

  // Helper method to check if user is admin
  async isAdmin(user: AuthenticatedUser): Promise<boolean> {
    const staff = await this.getUserStaff(user);
    return staff.some(s => 
      s.Role.is_leadership || 
      s.Role.title.toLowerCase().includes('administrator') ||
      s.Role.title.toLowerCase().includes('superintendent') ||
      s.Role.priority >= 9
    );
  }

  // Helper method to check if user is staff
  async isStaff(user: AuthenticatedUser): Promise<boolean> {
    const staff = await this.getUserStaff(user);
    return staff.length > 0;
  }

  // Helper method to check if user is in leadership
  async isLeadership(user: AuthenticatedUser): Promise<boolean> {
    const staff = await this.getUserStaff(user);
    return staff.some(s => s.Role.is_leadership);
  }

  // Get user's primary staff record
  async getPrimaryStaff(user: AuthenticatedUser): Promise<StaffWithRole | null> {
    const staff = await this.getUserStaff(user);
    if (staff.length === 0) return null;
    
    // Return highest priority role
    return staff.reduce((highest, current) => 
      current.Role.priority > highest.Role.priority ? current : highest
    );
  }

  // Get user's roles
  async getUserRoles(user: AuthenticatedUser): Promise<StaffWithRole['Role'][]> {
    const staff = await this.getUserStaff(user);
    return staff.map(s => s.Role);
  }

  // Get user's departments
  async getUserDepartments(user: AuthenticatedUser): Promise<StaffWithRole['Department'][]> {
    const staff = await this.getUserStaff(user);
    const departments = staff.map(s => s.Department);
    // Remove duplicates
    return departments.filter((dept, index, self) => 
      index === self.findIndex(d => d.id === dept.id)
    );
  }

  // Get user's schools
  async getUserSchools(user: AuthenticatedUser): Promise<StaffWithRole['School'][]> {
    const staff = await this.getUserStaff(user);
    const schools = staff.map(s => s.School);
    // Remove duplicates
    return schools.filter((school, index, self) => 
      index === self.findIndex(s => s.id === school.id)
    );
  }

  // Check if user can access another user's data
  async canAccessUser(user: AuthenticatedUser, targetUserId: string): Promise<boolean> {
    // Self access
    if (user.id === targetUserId) return true;

    // Admin access
    if (await this.isAdmin(user)) return true;

    // Manager access
    const userStaff = await this.getUserStaff(user);
    const targetStaff = await prisma.staff.findMany({
      where: { user_id: parseInt(targetUserId) },
      select: { manager_id: true }
    });

    return userStaff.some(us => 
      targetStaff.some(ts => ts.manager_id === us.id)
    );
  }

  // Check if user can access meeting
  async canAccessMeeting(user: AuthenticatedUser, meetingId: number): Promise<boolean> {
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        select: {
          organizer_id: true,
          department_id: true,
          school_id: true,
          district_id: true
        }
      });

      if (!meeting) return false;

      const userStaff = await this.getUserStaff(user);
      
      // Check if user is organizer
      if (userStaff.some(s => s.id === meeting.organizer_id)) return true;

      // Check if user is in same department
      if (userStaff.some(s => s.department_id === meeting.department_id)) return true;

      // Check if user is in same school (for leadership)
      if (userStaff.some(s => s.Role.is_leadership && s.school_id === meeting.school_id)) return true;

      // Check if user is attendee
      const isAttendee = await prisma.meetingAttendee.findFirst({
        where: {
          meeting_id: meetingId,
          staff_id: { in: userStaff.map(s => s.id) }
        }
      });

      return !!isAttendee;

    } catch (error) {
      console.error('Error checking meeting access:', error);
      return false;
    }
  }

  // Check if cache is still valid
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  // Clear cache
  clearCache(): void {
    this.permissionsCache.clear();
    this.staffCache.clear();
    this.hierarchyCache.clear();
    this.lastCacheUpdate = 0;
  }

  // Refresh cache
  async refreshCache(): Promise<void> {
    this.clearCache();
    this.lastCacheUpdate = Date.now();
  }

  // Get all permissions for a user (for debugging/admin)
  async getUserPermissions(user: AuthenticatedUser): Promise<RolePermission[]> {
    const staff = await this.getUserStaff(user);
    const permissions: RolePermission[] = [];

    for (const staffRecord of staff) {
      const rolePermissions = this.generateRolePermissions(staffRecord.Role);
      permissions.push(...rolePermissions);
    }

    return permissions;
  }

  // Generate permissions based on role
  private generateRolePermissions(role: StaffWithRole['Role']): RolePermission[] {
    const permissions: RolePermission[] = [];
    const now = new Date();

    // Base permissions for all roles
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

    // Role-specific permissions
    if (role.is_leadership) {
      permissions.push({
        id: `${role.id}_leadership_access`,
        roleId: role.id,
        resource: 'school',
        action: 'manage',
        priority: role.priority,
        granted: true,
        createdAt: now,
        updatedAt: now
      });
    }

    if (role.priority >= 8) {
      permissions.push({
        id: `${role.id}_high_priority`,
        roleId: role.id,
        resource: 'staff',
        action: 'manage',
        priority: role.priority,
        granted: true,
        createdAt: now,
        updatedAt: now
      });
    }

    return permissions;
  }
} 
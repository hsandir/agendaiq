/**
 * DYNAMIC MENU SYSTEM
 * 
 * Bu sistem:
 * 1. Kullanıcının rolüne göre dinamik menü oluşturur
 * 2. Permission-based menu filtering yapar
 * 3. Hierarchical menu structure destekler
 * 4. Cache ile performans optimizasyonu sağlar
 */

import { AuthenticatedUser as _AuthenticatedUser } from '../auth/auth-utils';
import { DynamicRBAC } from './dynamic-rbac';

export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  description?: string;
  parentId?: string;
  order: number;
  requiredPermissions: MenuPermission[];
  visibility: MenuVisibility;
  children?: MenuItem[];
  metadata?: Record<string, unknown>;
}

export interface MenuPermission {
  resource: string;
  action: string;
  scope?: string;
}

export interface MenuVisibility {
  roles?: string[];
  permissions?: MenuPermission[];
  conditions?: MenuCondition[];
  minLevel?: number;
  maxLevel?: number;
}

export interface MenuCondition {
  type: 'role' | 'permission' | 'custom';
  operator: 'equals' | 'contains' | 'not_equals';
  value: unknown
}

export interface MenuStructure {
  userId: string;
  items: MenuItem[];
  generatedAt: Date;
  permissions: string[];
}

// ===== PREDEFINED MENU ITEMS =====

export const MENU_DEFINITIONS: MenuItem[] = [
  // Dashboard
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'FiHome',
    order: 1,
    requiredPermissions: [{ resource: 'dashboard', action: 'read' }],
    visibility: {
      roles: ['user', 'staff', 'admin'],
      minLevel: 1
    }
  },

  // Meetings
  {
    id: 'meetings',
    label: 'Meetings',
    href: '/dashboard/meetings',
    icon: 'FiCalendar',
    order: 2,
    requiredPermissions: [{ resource: 'meetings', action: 'read' }],
    visibility: {
      roles: ['staff', 'admin'],
      minLevel: 2
    }
  },

  // Project Management
  {
    id: 'project-management',
    label: 'Project Management',
    href: '/dashboard/project-management',
    icon: 'FiSettings',
    order: 3,
    requiredPermissions: [{ resource: 'project', action: 'manage' }],
    visibility: {
      roles: ['admin', 'manager'],
      permissions: [{ resource: 'project', action: 'manage' }]
    }
  },

  // Settings Parent
  {
    id: 'settings',
    label: 'Settings',
    icon: 'FiSettings',
    order: 10,
    requiredPermissions: [{ resource: 'settings', action: 'read' }],
    visibility: {
      roles: ['staff', 'admin'],
      minLevel: 2
    },
    children: []
  },

  // Account Settings
  {
    id: 'settings-account',
    label: 'Account',
    parentId: 'settings',
    order: 1,
    requiredPermissions: [{ resource: 'user', action: 'read', scope: 'own' }],
    visibility: {
      roles: ['user', 'staff', 'admin']
    },
    children: [
      {
        id: 'settings-profile',
        label: 'Profile',
        href: '/dashboard/settings/profile',
        icon: 'FiUser',
        parentId: 'settings-account',
        order: 1,
        requiredPermissions: [{ resource: 'user', action: 'read', scope: 'own' }],
        visibility: { roles: ['user', 'staff', 'admin'] }
      },
      {
        id: 'settings-security',
        label: 'Security',
        href: '/dashboard/settings/security',
        icon: 'FiLock',
        parentId: 'settings-account',
        order: 2,
        requiredPermissions: [{ resource: 'user', action: 'update', scope: 'own' }],
        visibility: { roles: ['user', 'staff', 'admin'] }
      },
      {
        id: 'settings-notifications',
        label: 'Notifications',
        href: '/dashboard/settings/notifications',
        icon: 'FiBell',
        parentId: 'settings-account',
        order: 3,
        requiredPermissions: [{ resource: 'user', action: 'update', scope: 'own' }],
        visibility: { roles: ['user', 'staff', 'admin'] }
      }
    ]
  },

  // Administration Settings
  {
    id: 'settings-admin',
    label: 'Administration',
    parentId: 'settings',
    order: 2,
    requiredPermissions: [{ resource: 'admin', action: 'read' }],
    visibility: {
      roles: ['admin'],
      permissions: [{ resource: 'admin', action: 'read' }]
    },
    children: [
      {
        id: 'settings-users',
        label: 'User Management',
        href: '/dashboard/settings/users',
        icon: 'FiUsers',
        parentId: 'settings-admin',
        order: 1,
        requiredPermissions: [{ resource: 'users', action: 'manage' }],
        visibility: { roles: ['admin'] }
      },
      {
        id: 'settings-roles',
        label: 'Role Management',
        href: '/dashboard/settings/roles',
        icon: 'FiShield',
        parentId: 'settings-admin',
        order: 2,
        requiredPermissions: [{ resource: 'roles', action: 'manage' }],
        visibility: { roles: ['admin'] }
      },
      {
        id: 'settings-permissions',
        label: 'Permissions',
        href: '/dashboard/settings/permissions',
        icon: 'FiKey',
        parentId: 'settings-admin',
        order: 3,
        requiredPermissions: [{ resource: 'permissions', action: 'manage' }],
        visibility: { roles: ['admin'] }
      }
    ]
  },

  // System Management
  {
    id: 'system',
    label: 'System',
    icon: 'FiMonitor',
    order: 20,
    requiredPermissions: [{ resource: 'system', action: 'read' }],
    visibility: {
      roles: ['admin'],
      permissions: [{ resource: 'system', action: 'read' }]
    },
    children: [
      {
        id: 'system-overview',
        label: 'System Overview',
        href: '/dashboard/system',
        icon: 'FiMonitor',
        parentId: 'system',
        order: 1,
        requiredPermissions: [{ resource: 'system', action: 'read' }],
        visibility: { roles: ['admin'] }
      },
      {
        id: 'system-health',
        label: 'System Health',
        href: '/dashboard/system/health',
        icon: 'FiActivity',
        parentId: 'system',
        order: 2,
        requiredPermissions: [{ resource: 'system', action: 'monitor' }],
        visibility: { roles: ['admin'] }
      },
      {
        id: 'system-database',
        label: 'Database Management',
        href: '/dashboard/system/database',
        icon: 'FiDatabase',
        parentId: 'system',
        order: 3,
        requiredPermissions: [{ resource: 'database', action: 'manage' }],
        visibility: { roles: ['admin'] }
      }
    ]
  }
];

// ===== DYNAMIC MENU CLASS =====

export class DynamicMenu {
  private static instance: DynamicMenu;
  private rbac: DynamicRBAC;
  private menuCache = new Map<string, MenuStructure>();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  static getInstance(): DynamicMenu {
    if (!DynamicMenu.instance) {
      DynamicMenu.instance = new DynamicMenu();
    }
    return DynamicMenu.instance;
  }

  constructor() {
    this.rbac = DynamicRBAC.getInstance();
  }

  // Generate menu structure for user
  async generateMenu(user: _AuthenticatedUser): Promise<MenuStructure> {
    const cacheKey = `menu_${user.id}`;
    
    // Check cache first
    const cached = this.menuCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.generatedAt)) {
      return cached;
    }

    try {
      // Get user permissions
      const userPermissions = await this.rbac.getUserPermissions(user);
      const permissionStrings = (userPermissions.map(p => `${p.resource}:${p.action}${p.scope ? ':' + p.scope : ''}`));

      // Filter menu items based on permissions
      const visibleItems = await this.filterMenuItems(MENU_DEFINITIONS, user, userPermissions);
      
      // Build hierarchical structure
      const menuStructure = this.buildMenuHierarchy(visibleItems);

      const result: MenuStructure = {
        userId: user.id.toString(),
        items: menuStructure,
        generatedAt: new Date(),
        permissions: permissionStrings
      };

      // Cache the result
      this.menuCache.set(cacheKey, result);
      
      return result;

    } catch (error: unknown) {
      console.error('Error generating menu:', error);
      return {
        userId: user.id.toString(),
        items: [],
        generatedAt: new Date(),
        permissions: []
      };
    }
  }

  // Filter menu items based on user permissions
  private async filterMenuItems(
    items: MenuItem[],
    user: _AuthenticatedUser,
    userPermissions: { resource: string; action: string; scope?: string }[]
  ): Promise<MenuItem[]> {
    const visibleItems: MenuItem[] = [];

    for (const item of items) {
      // Check visibility conditions
      const isVisible = await this.checkMenuVisibility(item, user, userPermissions);
      
      if (isVisible) {
        const filteredItem = { ...item };
        
        // Recursively filter children
        if (item.children && item.children.length > 0) {
          filteredItem.children = await this.filterMenuItems(item.children, user, userPermissions);
        }
        
        visibleItems.push(filteredItem);
      }
    }

    return visibleItems;
  }

  // Check if menu item should be visible to user
  private async checkMenuVisibility(
    item: MenuItem,
    user: _AuthenticatedUser,
    userPermissions: { resource: string; action: string; scope?: string }[]
  ): Promise<boolean> {
    // Check required permissions
    for (const permission of item.requiredPermissions) {
      const hasPermission = await this.rbac.hasPermission(
        user,
        permission.resource,
        permission.action
      );
      
      if (!hasPermission) {
        return false;
      }
    }

    // Check visibility rules
    if (item.visibility) {
      // Check role-based visibility
      if (item.visibility.roles) {
        const userRole = await this.getUserRole(user);
        if (userRole && !item.visibility.roles.includes(userRole)) {
          return false;
        }
      }

      // Check permission-based visibility
      if (item.visibility.permissions) {
        for (const permission of item.visibility.permissions) {
          const hasPermission = await this.rbac.hasPermission(
            user,
            permission.resource,
            permission.action
          );
          
          if (!hasPermission) {
            return false;
          }
        }
      }

      // Check custom conditions
      if (item.visibility.conditions) {
        for (const condition of item.visibility.conditions) {
          const conditionMet = await this.checkMenuCondition(condition, user);
          if (!conditionMet) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Check menu condition
  private async checkMenuCondition(condition: MenuCondition, user: _AuthenticatedUser): Promise<boolean> {
    switch (condition.type) {
      case 'role':
        const userRole = await this.getUserRole(user);
        return this.compareValues(userRole, condition.operator, condition.value);
        
      case 'permission':
        // Implementation for permission-based conditions
        return true;
        
      case 'custom':
        // Implementation for custom conditions
        return true;
        
      default:
        return true
    }
  }

  // Compare values based on operator
  private compareValues(actual: string | null, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(String(expected));
      case 'not_equals':
        return actual !== expected;
      default:
        return true
    }
  }

  // Get user role
  private async getUserRole(user: _AuthenticatedUser): Promise<string | null> {
    try {
      const isAdmin = await this.rbac.isAdmin(user);
      if (isAdmin) return 'admin';
      
      const isStaff = await this.rbac.isStaff(user);
      if (isStaff) return 'staff';
      
      return 'user';
    } catch (error: unknown) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Build hierarchical menu structure
  private buildMenuHierarchy(items: MenuItem[]): MenuItem[] {
    const itemMap = new Map<string, MenuItem>();
    const rootItems: MenuItem[] = [];

    // Create item map
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build hierarchy
    items.forEach(item => {
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        const child = itemMap.get(item.id);
        if (parent && child) {
          if (!parent.children) parent.children = [];
          parent.children.push(child);
        }
      } else {
        const rootItem = itemMap.get(item.id);
        if (rootItem) {
          rootItems.push(rootItem);
        }
      }
    });

    // Sort items by order
    const sortItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .sort((a, b) => a.order - b.order)
        .map(item => ({
          ...item,
          children: item.children ? sortItems(item.children) : []
        }));
    };

    return sortItems(rootItems);
  }

  // Check if cache is still valid
  private isCacheValid(generatedAt: Date): boolean {
    return Date.now() - generatedAt.getTime() < this.cacheExpiry
  }

  // Clear menu cache
  clearCache(userId?: string): void {
    if (userId) {
      this.menuCache.delete(`menu_${userId}`);
    } else {
      this.menuCache.clear();
    }
  }

  // Get menu by path
  async getMenuByPath(user: _AuthenticatedUser, path: string): Promise<MenuItem | null> {
    const menuStructure = await this.generateMenu(user);
    
    const findInItems = (items: MenuItem[], targetPath: string): MenuItem | null => {
      for (const item of items) {
        if (item.href === targetPath) {
          return item
        }
        
        if (item.children) {
          const found = findInItems(item.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    return findInItems(menuStructure.items, path);
  }

  // Check if user can access menu item
  async canAccessMenu(user: _AuthenticatedUser, menuId: string): Promise<boolean> {
    const menuStructure = await this.generateMenu(user);
    
    const findMenuItem = (items: MenuItem[], targetId: string): MenuItem | null => {
      for (const item of items) {
        if (item.id === targetId) {
          return item
        }
        
        if (item.children) {
          const found = findMenuItem(item.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    return findMenuItem(menuStructure.items, menuId) !== null;
  }

  // Get breadcrumb for path
  async getBreadcrumb(user: _AuthenticatedUser, path: string): Promise<MenuItem[]> {
    const menuStructure = await this.generateMenu(user);
    const breadcrumb: MenuItem[] = [];
    
    const findPath = (items: MenuItem[], targetPath: string, currentPath: MenuItem[]): boolean => {
      for (const item of items) {
        const newPath = [...currentPath, item];
        
        if (item.href === targetPath) {
          breadcrumb.push(...newPath);
          return true;
        }
        
        if (item.children && findPath(item.children, targetPath, newPath)) {
          return true;
        }
      }
      return false;
    };

    findPath(menuStructure.items, path, []);
    return breadcrumb;
  }
} 
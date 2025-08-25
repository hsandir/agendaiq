"use client";

import { useState, useEffect } from 'react';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Capability, RoleKey } from '@/lib/auth/policy';

// Define all pages and their requirements
const ALL_PAGES = [
  // Dashboard
  { 
    path: '/dashboard', 
    name: 'Dashboard Home',
    category: 'Dashboard',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Main dashboard'
  },
  
  // Settings - General
  {
    path: '/dashboard/settings',
    name: 'Settings Home',
    category: 'Settings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Settings overview'
  },
  {
    path: '/dashboard/settings/interface',
    name: 'Interface Settings',
    category: 'Settings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'UI preferences'
  },
  {
    path: '/dashboard/settings/theme',
    name: 'Theme Settings',
    category: 'Settings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Theme selection'
  },
  {
    path: '/dashboard/settings/layout',
    name: 'Layout Settings',
    category: 'Settings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Layout preferences'
  },
  {
    path: '/dashboard/settings/notifications',
    name: 'Notifications',
    category: 'Settings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Notification preferences'
  },
  {
    path: '/dashboard/settings/security',
    name: 'Security Settings',
    category: 'Settings',
    authType: 'requireAuth',
    capabilities: [],
    description: '2FA and password'
  },

  // Settings - Admin
  {
    path: '/dashboard/settings/system',
    name: 'System Settings',
    category: 'Admin',
    authType: 'requireCapability',
    capabilities: [(Capability.OPS_HEALTH)],
    description: 'System configuration'
  },
  {
    path: '/dashboard/settings/backup',
    name: 'Backup & Restore',
    category: 'Admin',
    authType: 'requireCapability',
    capabilities: [(Capability.OPS_BACKUP)],
    description: 'Database backups'
  },
  {
    path: '/dashboard/settings/audit-logs',
    name: 'Audit Logs',
    category: 'Admin',
    authType: 'requireCapability',
    capabilities: [Capability.OPS_LOGS, Capability.USER_MANAGE],
    description: 'System audit logs (requires logs AND user management)'
  },
  {
    path: '/dashboard/settings/audit',
    name: 'Audit Overview',
    category: 'Admin',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Audit dashboard'
  },
  {
    path: '/dashboard/settings/monitoring',
    name: 'Monitoring',
    category: 'Admin',
    authType: 'requireMonitoring',
    capabilities: [(Capability.OPS_MONITORING)],
    description: 'System monitoring'
  },

  // Settings - School Management
  {
    path: '/dashboard/settings/school',
    name: 'School Settings',
    category: 'School',
    authType: 'requireCapability',
    capabilities: [(Capability.SCHOOL_MANAGE)],
    description: 'School configuration'
  },
  {
    path: '/dashboard/settings/staff-upload',
    name: 'Staff Upload',
    category: 'School',
    authType: 'requireCapability',
    capabilities: [Capability.STAFF_IMPORT, Capability.USER_MANAGE],
    description: 'Bulk staff import (requires import AND user creation)'
  },
  {
    path: '/dashboard/settings/permissions',
    name: 'Permissions',
    category: 'School',
    authType: 'requireCapability',
    capabilities: [Capability.PERM_MANAGE, Capability.ROLE_MANAGE],
    description: 'Permission management (requires permission AND role management)'
  },
  {
    path: '/dashboard/settings/role-hierarchy',
    name: 'Role Hierarchy',
    category: 'School',
    authType: 'requireAuth',
    capabilities: [],
    description: 'View role structure'
  },
  {
    path: '/dashboard/settings/role-hierarchy/roles',
    name: 'Manage Roles',
    category: 'School',
    authType: 'requireRoleManagement',
    capabilities: [(Capability.ROLE_MANAGE)],
    description: 'Edit roles'
  },
  {
    path: '/dashboard/settings/role-hierarchy/user-assignment',
    name: 'User Assignment',
    category: 'School',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Assign users to roles'
  },
  {
    path: '/dashboard/settings/role-hierarchy/visualization',
    name: 'Role Visualization',
    category: 'School',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Visual role hierarchy'
  },

  // Meetings
  {
    path: '/dashboard/meetings',
    name: 'Meetings List',
    category: 'Meetings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'View all meetings'
  },
  {
    path: '/dashboard/meetings/new',
    name: 'Create Meeting',
    category: 'Meetings',
    authType: 'requireMeetingCreate',
    capabilities: [(Capability.MEETING_CREATE)],
    description: 'Create new meeting'
  },
  {
    path: '/dashboard/settings/meeting-management',
    name: 'Meeting Management',
    category: 'Meetings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Meeting settings'
  },
  {
    path: '/dashboard/settings/meeting-templates',
    name: 'Meeting Templates',
    category: 'Meetings',
    authType: 'requireMeetingCreate',
    capabilities: [(Capability.MEETING_CREATE)],
    description: 'Manage templates'
  },
  {
    path: '/dashboard/settings/meeting-permissions',
    name: 'Meeting Permissions',
    category: 'Meetings',
    authType: 'requireMeetingCreate',
    capabilities: [(Capability.MEETING_CREATE)],
    description: 'Meeting access control'
  },
  {
    path: '/dashboard/settings/meeting-audit',
    name: 'Meeting Audit',
    category: 'Meetings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Meeting activity logs'
  },
  {
    path: '/dashboard/settings/zoom-user-preferences',
    name: 'Zoom Preferences',
    category: 'Meetings',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Zoom settings'
  },

  // Monitoring Pages
  {
    path: '/dashboard/monitoring',
    name: 'Monitoring Dashboard',
    category: 'Monitoring',
    authType: 'requireAuth',
    capabilities: [],
    description: 'Monitoring overview'
  },
  {
    path: '/dashboard/monitoring/cicd',
    name: 'CI/CD Pipeline',
    category: 'Monitoring',
    authType: 'requireCapability',
    capabilities: [(Capability.DEV_CI)],
    description: 'CI/CD monitoring'
  },
  {
    path: '/dashboard/system',
    name: 'System Dashboard',
    category: 'System',
    authType: 'requireAuth',
    capabilities: [],
    description: 'System overview'
  },
  {
    path: '/dashboard/system/alerts',
    name: 'System Alerts',
    category: 'System',
    authType: 'client-side',
    capabilities: [],
    description: 'Alert configuration'
  },

  // Debug Pages
  {
    path: '/dashboard/debug-capabilities',
    name: 'Debug Capabilities',
    category: 'Debug',
    authType: 'none',
    capabilities: [],
    description: 'Debug user capabilities'
  },
  {
    path: '/dashboard/permissions-check',
    name: 'Permissions Check',
    category: 'Debug',
    authType: 'client-side',
    capabilities: [],
    description: 'This page'
  },
];

// API Routes
const API_ROUTES = [
  { path: '/api/system/backup', method: 'GET/POST/PUT', capability: Capability.OPS_BACKUP },
  { path: '/api/system/alerts', method: 'GET/DELETE', capability: Capability.OPS_ALERTS },
  { path: '/api/system/settings', method: 'GET/POST', capability: Capability.OPS_HEALTH },
  { path: '/api/system/server', method: 'GET', capability: Capability.OPS_HEALTH },
  { path: '/api/system/logs', method: 'GET', capability: Capability.OPS_LOGS },
  { path: '/api/monitoring/performance', method: 'GET', capability: Capability.OPS_MONITORING },
  { path: '/api/admin/audit-logs', method: 'GET', capability: Capability.USER_MANAGE },
  { path: '/api/roles', method: 'GET/POST', capability: Capability.ROLE_MANAGE },
  { path: '/api/meetings', method: 'GET/POST', capability: Capability.MEETING_CREATE },
  { path: '/api/dev/metrics', method: 'GET', capability: Capability.DEV_DEBUG },
];

export default function PermissionsCheckPage() {
  const { __user, loading: __authLoading, __can, __is } = useAuthorization();
  const [userCapabilities, setUserCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      // Get user capabilities from session
      setUserCapabilities((user as Record<string, unknown>).capabilities ?? []);
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const checkAccess = (authType: string, capabilities: string[]) => {
    if (!user) return false;
    
    // Check basic auth types
    if (authType === 'none' || authType === 'client-side') return true;
    if (authType === 'requireAuth') return true;
    
    // System admin has all access
    if (user.is_system_admin) return true;
    
    // Check admin flags for specific auth types
    if (authType === 'requireDevAdmin' && is(RoleKey.DEV_ADMIN)) return true;
    if (authType === 'requireOpsAdmin' && is(RoleKey.OPS_ADMIN)) return true;
    
    // If no capabilities required, access is granted
    if (!capabilities ?? capabilities.length === 0) return true;
    
    // Check if user has ALL required capabilities using can() helper
    const hasAllCapabilities = capabilities.every(cap => {
      // Use the can() function from useAuthorization
      return can(cap as Capability);
    });
    
    return hasAllCapabilities;
  };

  const filteredPages = ALL_PAGES.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'all') return true;
    if (filter === 'accessible') return checkAccess(page.authType, page.capabilities);
    if (filter === 'blocked') return !checkAccess(page.authType, page.capabilities);
    if (filter === 'admin') return page.category === 'Admin';
    return page.category === filter;
  });

  const categories = [...new Set(ALL_PAGES.map(p => p.category))];
  
  const stats = {
    total: ALL_PAGES.length,
    accessible: ALL_PAGES.filter(p => checkAccess(p.authType, p.capabilities)).length,
    blocked: ALL_PAGES.filter(p => !checkAccess(p.authType, p.capabilities)).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Permissions Check Dashboard</h1>
        
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Current User</h2>
          {session?.user ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
              <div>
                <strong className="text-gray-900">Email:</strong> {session.user.email}
              </div>
              <div>
                <strong className="text-gray-900">System Admin:</strong> {session.user.is_system_admin ? '✅' : '❌'}
              </div>
              <div>
                <strong className="text-gray-900">School Admin:</strong> {session.user?.is_school_admin ? '✅' : '❌'}
              </div>
              <div className="md:col-span-3">
                <strong className="text-gray-900">Capabilities ({userCapabilities.length}):</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {userCapabilities.length > 0 ? (
                    userCapabilities.map((cap, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        {cap}
                      </span>
                    ))
                  ) : (
                    <span className="text-red-600">No capabilities</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-600">Not authenticated</div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600">Total Pages</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-800">{stats.accessible}</div>
            <div className="text-green-600">Accessible</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-800">{stats.blocked}</div>
            <div className="text-red-600">Blocked</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Pages</option>
              <option value="accessible">Accessible</option>
              <option value="blocked">Blocked</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pages Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Auth Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Capability Required
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Access
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPages.map((page, idx) => {
                const hasAccess = checkAccess(page.authType, page.capabilities);
                return (
                  <tr key={idx} className={hasAccess ? '' : 'bg-red-50'}>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{page.name}</div>
                        <div className="text-xs text-gray-500">{page.path}</div>
                        <div className="text-xs text-gray-400">{page.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                        {page.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        page.authType === 'requireAuth' ? 'bg-green-100 text-green-800' :
                        page.authType === 'none' ? 'bg-gray-100 text-gray-800' :
                        page.authType.includes('Admin') ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {page.authType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {page.capabilities && page.capabilities.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {page.capabilities.map((cap, i) => (
                            <span key={i} className="px-2 py-1 text-xs font-mono bg-purple-100 text-purple-800 rounded">
                              {cap}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasAccess ? (
                        <span className="text-2xl">✅</span>
                      ) : (
                        <span className="text-2xl">❌</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block px-3 py-1 text-xs rounded whitespace-nowrap ${
                          hasAccess 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Test
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* API Routes Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">API Routes Protection</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Route</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Methods</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Capability</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {API_ROUTES.map((route, idx) => {
                  const hasAccess = userCapabilities.includes(route.capability) || 
                                   session?.user?.is_system_admin ||
                                   (session?.user?.is_school_admin && route.capability.startsWith('ops:'));
                  return (
                    <tr key={idx} className={hasAccess ? '' : 'bg-red-50'}>
                      <td className="px-4 py-2 text-sm font-mono text-gray-800">{route.path}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{route.method}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 text-xs font-mono bg-purple-100 text-purple-800 rounded">
                          {route.capability}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {hasAccess ? '✅' : '❌'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-semibold mb-2 text-gray-900">Auth Types Legend:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div><span className="font-mono bg-green-100 px-1">requireAuth</span> - Basic auth required</div>
            <div><span className="font-mono bg-red-100 px-1">requireDevAdmin</span> - System admin only</div>
            <div><span className="font-mono bg-red-100 px-1">requireOpsAdmin</span> - School admin required</div>
            <div><span className="font-mono bg-blue-100 px-1">requireCapability</span> - Specific capability</div>
            <div><span className="font-mono bg-gray-100 px-1">none</span> - No auth check</div>
            <div><span className="font-mono bg-gray-100 px-1">client-side</span> - Client component</div>
            <div><span className="font-mono bg-yellow-100 px-1">requireLeadership</span> - Legacy (needs fix)</div>
            <div><span className="font-mono bg-yellow-100 px-1">requireStaff</span> - Legacy (needs fix)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
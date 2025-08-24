import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { getUserCapabilities, can, Capability, isOpsAdmin } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export default async function DebugCapabilitiesPage() {
  const user = await requireAuth(AuthPresets.requireDevelopment);

  // Get capabilities from database
  const capabilities = await getUserCapabilities(user.id);
  
  // Get user's role permissions
  const userWithRole = await prisma.users.findUnique({
    where: { id: parseInt(user.id) },
    include: {
      staff: {
        include: {
          role: true
        }
      }
    }
  });

  const checks = {
    // User info
    userId: user.id,
    email: user.email,
    is_system_admin: user.is_system_admin ?? false,
    is_school_admin: (user as Record<string, unknown>).is_school_admin ?? false,
    
    // Role info
    roleKey: userWithRole?.staff?.[0]?.role?.key || 'No Key',
    roleId: userWithRole?.staff?.[0]?.role?.id,
    
    // Permissions from database
    permissionCount: userWithRole?.staff?.[0]?.role?.permission?.length ?? 0,
    permissions: userWithRole?.staff?.[0]?.role?.permission?.map(p => ({
      id: p.id,
      capability: p.capability,
      resource: p.resource,
      action: p.action
    })) || [],
    
    // Computed capabilities
    capabilities: capabilities,
    capabilityCount: capabilities.length,
    
    // Specific capability checks
    hasOpsBackup: capabilities.includes(Capability.OPS_BACKUP),
    hasOpsLogs: capabilities.includes(Capability.OPS_LOGS),
    hasOpsHealth: capabilities.includes(Capability.OPS_HEALTH),
    hasOpsAlerts: capabilities.includes(Capability.OPS_ALERTS),
    
    // Function checks
    isOpsAdmin: isOpsAdmin(user),
    canOpsBackup: can(user, Capability.OPS_BACKUP),
    canOpsLogs: can(user, Capability.OPS_LOGS),
    canOpsHealth: can(user, Capability.OPS_HEALTH),
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Debug User Capabilities</h1>
      
      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">User Information</h2>
          <div className="space-y-2 text-gray-700">
            <div><strong className="text-gray-900">Email:</strong> {checks.email}</div>
            <div><strong className="text-gray-900">User ID:</strong> {checks.userId}</div>
            <div><strong className="text-gray-900">System Admin:</strong> {checks.is_system_admin ? '✅ Yes' : '❌ No'}</div>
            <div><strong className="text-gray-900">School Admin:</strong> {checks.is_school_admin ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Role Information</h2>
          <div className="space-y-2 text-gray-700">
            <div><strong className="text-gray-900">Role Key:</strong> {checks.roleKey}</div>
            <div><strong className="text-gray-900">Role ID:</strong> {checks.roleId}</div>
            <div><strong className="text-gray-900">Is Ops Admin:</strong> {checks.isOpsAdmin ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>

        {/* Permissions from DB */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Database Permissions ({checks.permissionCount})</h2>
          {checks.permissions.length > 0 ? (
            <div className="space-y-1">
              {checks.permissions.map((perm, idx) => (
                <div key={idx} className="text-sm font-mono bg-gray-100 p-2 rounded text-gray-800 border border-gray-200">
                  {perm.capability} ({perm.resource}:{perm.action})
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-600">❌ No permissions in database!</div>
          )}
        </div>

        {/* Computed Capabilities */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Computed Capabilities ({checks.capabilityCount})</h2>
          {checks.capabilities.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {checks.capabilities.map((cap, idx) => (
                <div key={idx} className="text-sm font-mono bg-green-100 p-2 rounded text-green-800 border border-green-200">
                  {cap}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-600">❌ No capabilities computed!</div>
          )}
        </div>

        {/* Specific Checks */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Specific Capability Checks</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>OPS_BACKUP:</span>
              <span>{checks.hasOpsBackup ? '✅' : '❌'} / can(): {checks.canOpsBackup ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between">
              <span>OPS_LOGS:</span>
              <span>{checks.hasOpsLogs ? '✅' : '❌'} / can(): {checks.canOpsLogs ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between">
              <span>OPS_HEALTH:</span>
              <span>{checks.hasOpsHealth ? '✅' : '❌'} / can(): {checks.canOpsHealth ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between">
              <span>OPS_ALERTS:</span>
              <span>{checks.hasOpsAlerts ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>

        {/* Test Links */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Test Access</h2>
          <div className="space-x-4">
            <a href="/dashboard/settings/backup" className="text-blue-600 hover:underline">
              Backup Page →
            </a>
            <a href="/dashboard/settings/audit-logs" className="text-blue-600 hover:underline">
              Audit Logs →
            </a>
            <a href="/dashboard/settings/system" className="text-blue-600 hover:underline">
              System Settings →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
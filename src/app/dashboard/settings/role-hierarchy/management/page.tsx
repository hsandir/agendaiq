import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { RoleHierarchyManagement } from '@/components/settings/RoleHierarchyManagement';

export const metadata: Metadata = {
  title: "Role Hierarchy Management | AgendaIQ",
  description: "Define and manage custom roles and their hierarchies"
};

export default async function RoleHierarchyManagementPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Role Hierarchy Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Define and manage custom roles and their hierarchies
          </p>
        </div>
      </div>

      <div className="mt-8">
        <RoleHierarchyManagement />
      </div>
    </>
  );
} 
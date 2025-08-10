import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { RoleManagementForm } from "@/components/settings/RoleManagementForm";
import { RoleHierarchyManagement } from "@/components/settings/RoleHierarchyManagement";

export const metadata: Metadata = {
  title: "Admin Settings | AgendaIQ",
  description: "Administrative settings for role hierarchy management and user role assignment",
};

export default async function AdminSettingsPage() {
  // Use capability-based auth - only dev admins can access
  const user = await requireAuth(AuthPresets.requireDevAdmin);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Role Hierarchy Management</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Define and manage custom roles and their hierarchies. Each role can have multiple subordinate roles,
            creating a flexible organizational structure.
          </p>
          <RoleHierarchyManagement />
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">User Role Assignment</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Assign roles and departments to users based on the defined role hierarchy.
          </p>
          <RoleManagementForm />
        </div>
      </div>
    </div>
  );
} 
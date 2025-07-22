import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleManagementForm } from "@/components/settings/RoleManagementForm";
import { RoleHierarchyManagement } from "@/components/settings/RoleHierarchyManagement";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      Staff: {
        include: {
          Role: true,
          Department: true
        }
      }
    },
  });

  if (!user || user.Staff?.[0]?.Role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  return user;
}

export default async function AdminSettingsPage() {
  await getUser(); // Verify admin access

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Role Hierarchy Management</h2>
          <p className="text-sm text-gray-600 mb-6">
            Define and manage custom roles and their hierarchies. Each role can have multiple subordinate roles,
            creating a flexible organizational structure.
          </p>
          <RoleHierarchyManagement />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">User Role Assignment</h2>
          <p className="text-sm text-gray-600 mb-6">
            Assign roles and departments to users based on the defined role hierarchy.
          </p>
          <RoleManagementForm />
        </div>
      </div>
    </div>
  );
} 
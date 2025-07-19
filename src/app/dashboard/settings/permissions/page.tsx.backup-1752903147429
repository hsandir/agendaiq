import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Permissions Management",
  description: "Manage system permissions and access controls",
};

export default async function PermissionsPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  const user = await prisma.user.findUnique({
    where: { email: user.email },
    include: { 
      Staff: {
        include: {
          Role: true
        }
      }
    },
  });

  if (!user || user.staff?.Role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  const permissionGroups = [
    {
      name: "User Management",
      permissions: [
        { id: "user.create", label: "Create Users", description: "Create new user accounts" },
        { id: "user.edit", label: "Edit Users", description: "Modify existing user accounts" },
        { id: "user.delete", label: "Delete Users", description: "Remove user accounts" },
        { id: "user.view", label: "View Users", description: "View user account details" },
      ],
    },
    {
      name: "Role Management",
      permissions: [
        { id: "role.create", label: "Create Roles", description: "Create new roles" },
        { id: "role.edit", label: "Edit Roles", description: "Modify existing roles" },
        { id: "role.delete", label: "Delete Roles", description: "Remove roles" },
        { id: "role.assign", label: "Assign Roles", description: "Assign roles to users" },
      ],
    },
    {
      name: "Department Management",
      permissions: [
        { id: "dept.create", label: "Create Departments", description: "Create new departments" },
        { id: "dept.edit", label: "Edit Departments", description: "Modify existing departments" },
        { id: "dept.delete", label: "Delete Departments", description: "Remove departments" },
        { id: "dept.assign", label: "Assign Departments", description: "Assign users to departments" },
      ],
    },
    {
      name: "System Settings",
      permissions: [
        { id: "settings.view", label: "View Settings", description: "View system settings" },
        { id: "settings.edit", label: "Edit Settings", description: "Modify system settings" },
        { id: "settings.security", label: "Security Settings", description: "Manage security settings" },
        { id: "settings.backup", label: "Backup Settings", description: "Manage backup settings" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Permissions Management</h2>
        <p className="text-muted-foreground">
          Configure and manage system permissions and access controls.
        </p>
      </div>

      <div className="grid gap-6">
        {permissionGroups.map((group) => (
          <Card key={group.name}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>Manage {group.name.toLowerCase()} permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-medium">{permission.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 
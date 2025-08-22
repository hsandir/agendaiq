import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { Capability, RoleID } from '@/lib/auth/policy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Shield, Users, Settings, Building, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Permissions Management | AgendaIQ",
  description: "Manage system permissions and access controls",
};

export default async function PermissionsPage() {
  // Use capability-based auth - permission management capability required
  const user = await requireAuth({ requireAuth: true, requireCapability: Capability.PERM_MANAGE });

  // Fetch real permission data from database
  const roles = await prisma.role.findMany({
    include: {
      Department: true,
      Staff: {
        include: {
          User: true
        }
      }
    },
    orderBy: {
      priority: 'asc'
    }
  });

  // Calculate permission statistics
  const totalRoles = roles.length;
  const totalUsers = roles.reduce((acc, role) => acc + role.Staff.length, 0);
  const leadershipRoles = roles.filter(role => role.is_leadership).length;
  const regularRoles = totalRoles - leadershipRoles;

  // Permission categories based on role hierarchy
  const permissionCategories = [
    {
      name: "User Management",
      icon: Users,
      description: "Manage user accounts and profiles",
      permissions: [
        "Create new user accounts",
        "Edit user information",
        "Assign roles to users",
        "View user details",
        "Deactivate user accounts"
      ],
      roles: roles.filter(role => role.is_leadership || role.id === RoleID.OPS_ADMIN)
    },
    {
      name: "Role Management",
      icon: Shield,
      description: "Configure roles and permissions",
      permissions: [
        "Create new roles",
        "Edit role permissions",
        "Delete roles",
        "Manage role hierarchy",
        "Assign department permissions"
      ],
      roles: roles.filter(role => role.id === RoleID.OPS_ADMIN || role.id === RoleID.DEV_ADMIN)
    },
    {
      name: "Department Management",
      icon: Building,
      description: "Manage organizational structure",
      permissions: [
        "Create departments",
        "Edit department settings",
        "Assign users to departments",
        "Manage department hierarchy",
        "View department statistics"
      ],
      roles: roles.filter(role => role.is_leadership)
    },
    {
      name: "System Administration",
      icon: Settings,
      description: "System-wide settings and controls",
      permissions: [
        "Access system settings",
        "Manage security policies",
        "Configure backup settings",
        "View system logs",
        "Manage integrations"
      ],
      roles: roles.filter(role => role.id === RoleID.OPS_ADMIN || role.id === RoleID.DEV_ADMIN)
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Permissions Management</h2>
        <p className="text-muted-foreground">
          Configure and manage system permissions and access controls based on role hierarchy.
        </p>
      </div>

      {/* Permission Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              Active roles in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users with assigned roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leadership Roles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadershipRoles}</div>
            <p className="text-xs text-muted-foreground">
              Roles with leadership access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularRoles}</div>
            <p className="text-xs text-muted-foreground">
              Standard user roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Permission Categories */}
      <div className="grid gap-6">
        {permissionCategories.map((category) => (
          <Card key={category.name}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <category.icon className="h-5 w-5 text-primary" />
                <CardTitle>{category.name}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Permissions List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Available Permissions:</h4>
                <div className="grid gap-2">
                  {category.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roles with Access */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Roles with Access:</h4>
                <div className="flex flex-wrap gap-2">
                  {category.roles.length > 0 ? (
                    category.roles.map((role) => (
                      <Badge key={role.id} variant="outline" className="text-xs">
                        {role.title}
                        {role.is_leadership && (
                          <span className="ml-1 text-primary">(Leadership)</span>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No roles have access to this category</span>
                  )}
                </div>
              </div>

              {/* Department Information */}
              {category.roles.some(role => role.Department) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Department Access:</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.roles
                      .filter(role => role.Department)
                      .map((role) => (
                        <Badge key={role.id} variant="secondary" className="text-xs">
                          {role.Department?.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Hierarchy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            Role Hierarchy Information
          </CardTitle>
          <CardDescription>
            Understanding how permissions flow through the role hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-2">Leadership Roles (Priority 1-4)</h4>
                <div className="space-y-2">
                  {roles
                    .filter(role => role.is_leadership)
                    .sort((a, b) => a.priority - b.priority)
                    .map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-2 bg-primary rounded">
                        <span className="text-sm font-medium">{role.title}</span>
                        <Badge variant="outline" className="text-xs">
                          Priority {role.priority}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Regular Roles (Priority 5-6)</h4>
                <div className="space-y-2">
                  {roles
                    .filter(role => !role.is_leadership)
                    .sort((a, b) => a.priority - b.priority)
                    .map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{role.title}</span>
                        <Badge variant="outline" className="text-xs">
                          Priority {role.priority}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Permission Inheritance</h4>
              <p className="text-sm text-yellow-700">
                Leadership roles automatically inherit permissions from lower-priority roles. 
                Administrators have access to all system functions, while other roles have 
                department-specific access based on their position in the hierarchy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
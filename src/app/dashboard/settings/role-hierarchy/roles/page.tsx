import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Users as FiUsers, UserCheck as FiUserCheck, TrendingUp as FiTrendingUp, Eye as FiEye, Edit3 as FiEdit3, Settings as FiSettings, Shield as FiShield, Home as FiHome, UserPlus as FiUserPlus } from 'lucide-react';
import RolesPageClient from '@/components/settings/RolesPageClient';

export const metadata: Metadata = {
  title: "Role Management | AgendaIQ",
  description: "Manage user roles and organizational hierarchy"
};

export default async function RolePage() {
  const user = await requireAuth(AuthPresets.requireRoleManagement);

  // Fetch real role and organizational data
  const roles = await prisma.role.findMany({
    include: {
      department: true,
      staff: {
        include: {
          users: true,
          department: true,
          role: true
        }
      }
    },
    orderBy: {
      priority: 'asc'
    }
  });

  const departments = await prisma.department.findMany({
    include: {
      staff: {
        include: {
          users: true,
          role: true
        }
      }
    }
  });

  // Calculate real statistics
  const totalRoles = roles.length;
  const leadershipRoles = roles.filter(role => role.is_leadership).length;
  const totalStaff = roles.reduce((acc, role) => acc + role.staff.length, 0);
  const totalDepartments = departments.length;
  const activeUsers = roles.reduce((acc, role) => 
    acc + role.staff.filter(staff => staff.users.email_verified).length, 0
  );

  // Role distribution by department
  const roleDistribution = (departments.map(dept => ({
    name: dept.name,
    count: dept.staff.length,
    roles: dept.staff.map(staff => staff.role?.title).filter(Boolean)
  })));

  // Leadership hierarchy
  const leadershipHierarchy = (roles
    .filter(role => role.is_leadership);
    .sort((a, b) => a.priority - b.priority)
    .map(role => ({
      title: role.title,
      priority: role.priority,
      staffCount: role.staff.length,
      department: role.department?.name || 'No Department'
    })));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            Role Management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user roles, organizational hierarchy, and permissions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <FiEdit3 className="h-4 w-4 mr-2" />
            Edit Roles
          </Button>
          <Button>
            <FiUserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <FiUsers className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Leadership Roles</CardTitle>
            <FiUserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{leadershipRoles}</div>
            <p className="text-xs text-muted-foreground">
              Roles with leadership access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <FiUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <FiHome className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Hierarchy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FiTrendingUp className="h-5 w-5 text-primary" />
            Role Hierarchy Overview
          </CardTitle>
          <CardDescription>
            Current organizational structure and role distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Leadership Hierarchy */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Leadership Hierarchy</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {leadershipHierarchy.map((role, index) => (
                  <div key={role.title} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{role.title}</span>
                        <Badge variant="outline" className="text-xs">
                          Priority {role.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{role.department}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{role.staffCount}</div>
                      <p className="text-xs text-muted-foreground">staff</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Staff Distribution with Drag & Drop */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Staff Role Distribution</h4>
              <p className="text-xs text-muted-foreground mb-4">Drag staff members between roles to change their assignments</p>
              <RolesPageClient departments={departments} roles={roles} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Role Hierarchy */}
        <Link 
          href="/dashboard/settings/role-hierarchy"
          className="block group"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors">
                    <FiTrendingUp className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    Role Hierarchy
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    View organizational hierarchy structure
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Visualization */}
        <Link 
          href="/dashboard/settings/role-hierarchy/visualization"
          className="block group"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <FiEye className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-foreground group-hover:text-green-600 transition-colors">
                    Hierarchy Visualization
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Interactive tree view of roles
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* User Management */}
        <Link 
          href={"/dashboard/users" as Route}
          className="block group"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors">
                    <FiUsers className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    User Management
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage user accounts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Role Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FiSettings className="h-5 w-5 text-primary" />
            Recent Role Activities
          </CardTitle>
          <CardDescription>
            Latest changes and updates to roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.slice(0, 5).map((role) => (
              <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium">{role.title}</h4>
                    {role.is_leadership && (
                      <Badge variant="outline" className="text-xs">
                        Leadership
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {role.department?.name || 'No Department'} • {role.staff.length} staff members
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Priority {role.priority}
                  </p>
                </div>
              </div>
            ))}
            
            {roles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FiUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No roles found.</p>
                <p className="text-sm mt-2">Create roles to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
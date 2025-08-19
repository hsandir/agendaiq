'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Department {
  id: string;
  code: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  staffId: string;
  role: Role | null;
  department: Department | null;
  manager: User | null;
  loginNotifications: boolean;
  rememberDevices: boolean;
  suspiciousAlerts: boolean;
  twoFactorEnabled: boolean;
  schoolId: string | null;
}

export function RoleManagementForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, rolesRes, usersRes] = await Promise.all([
        fetch('/api/departments', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/roles', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/users', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!deptRes.ok || !rolesRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [deptData, rolesData, usersData] = await Promise.all([
        deptRes.json(),
        rolesRes.json(),
        usersRes.json()
      ]);

      // Handle APIResponse format for each endpoint
      setDepartments(Array.isArray(deptData) ? deptData : (deptData.data ?? deptData.departments ?? []));
      setRoles(Array.isArray(rolesData) ? rolesData : (rolesData.data ?? rolesData.roles ?? []));
      setUsers(Array.isArray(usersData) ? usersData : (usersData.data ?? usersData.users ?? []));
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const userId = formData.get('userId') as string;
    const roleId = formData.get('role') as string;
    const departmentId = formData.get('department') as string;
    const managerId = formData.get('manager') as string ?? undefined;
    const loginNotifications = formData.get('loginNotifications') === 'true';
    const rememberDevices = formData.get('rememberDevices') === 'true';
    const suspiciousAlerts = formData.get('suspiciousAlerts') === 'true';
    const twoFactorEnabled = formData.get('twoFactorEnabled') === 'true';

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId,
          departmentId,
          managerId,
          loginNotifications,
          rememberDevices,
          suspiciousAlerts,
          twoFactorEnabled,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update user');
      }

      toast({
        title: 'Success',
        description: 'User updated successfully.',
      });

      router.refresh();
      fetchData();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">Select User</Label>
              <select
                id="userId"
                name="userId"
                required
                className="mt-1 block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
                onChange={(e) => {
                  const user = users.find(u => u.id === e.target.value);
                  setSelectedUser(user ?? null);
                }}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    required
                    defaultValue={selectedUser.role?.id}
                    className="mt-1 block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    name="department"
                    required
                    defaultValue={selectedUser.department?.id}
                    className="mt-1 block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="manager">Manager</Label>
                  <select
                    id="manager"
                    name="manager"
                    defaultValue={selectedUser.manager?.id}
                    className="mt-1 block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
                  >
                    <option value="">No manager</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginNotifications">Login Notifications</Label>
                    <Switch
                      id="loginNotifications"
                      name="loginNotifications"
                      defaultChecked={selectedUser.loginNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="rememberDevices">Remember Devices</Label>
                    <Switch
                      id="rememberDevices"
                      name="rememberDevices"
                      defaultChecked={selectedUser.rememberDevices}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="suspiciousAlerts">Suspicious Activity Alerts</Label>
                    <Switch
                      id="suspiciousAlerts"
                      name="suspiciousAlerts"
                      defaultChecked={selectedUser.suspiciousAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="twoFactorEnabled">Two-Factor Authentication</Label>
                    <Switch
                      id="twoFactorEnabled"
                      name="twoFactorEnabled"
                      defaultChecked={selectedUser.twoFactorEnabled}
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
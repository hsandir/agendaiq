"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Role {
  id: string;
  title: string;
  Department?: {
    id: string;
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Staff {
  id: string;
  Role: Role;
  Department: Department;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  Staff: Staff[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users with staff relationships
      const usersResponse = await fetch('/api/users');
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Fetch roles with department info
      const rolesResponse = await fetch('/api/roles');
      if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
      const rolesData = await rolesResponse.json();
      setRoles(rolesData.roles || []);

      // Fetch departments
      const departmentsResponse = await fetch('/api/departments');
      if (!departmentsResponse.ok) throw new Error('Failed to fetch departments');
      const departmentsData = await departmentsResponse.json();
      setDepartments(departmentsData);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter roles by department
  const getRolesByDepartment = (departmentId: string) => {
    return roles.filter(role => role.Department?.id === departmentId);
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId: newRoleId }),
      });

      if (!response.ok) throw new Error('Failed to update role');

      toast({
        title: 'Success',
        description: 'User role updated successfully.',
      });

      // Refresh users list
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDepartmentChange = async (userId: string, newDepartmentId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/department`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentId: newDepartmentId }),
      });

      if (!response.ok) throw new Error('Failed to update department');

      toast({
        title: 'Success',
        description: 'User department updated successfully.',
      });

      // Refresh users list
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user department. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage users, their roles, and departments. Roles are filtered based on the user's department.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              // Get the first staff record (users should have at least one)
              const staff = user.Staff?.[0];
              // Get roles for this user's department
              const departmentRoles = staff?.Department?.id ? 
                getRolesByDepartment(staff.Department.id) : roles;
              
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {staff ? (
                      <Select
                        value={staff.Department?.id || ""}
                        onValueChange={(value: string) => handleDepartmentChange(user.id, value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                          {departments.map((department) => (
                            <SelectItem 
                              key={department.id} 
                              value={department.id}
                              className="cursor-pointer hover:bg-gray-100 px-3 py-2"
                            >
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">No department</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {staff ? (
                      <Select
                        value={staff.Role.id}
                        onValueChange={(value: string) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                          {departmentRoles.length > 0 ? (
                            departmentRoles.map((role) => (
                              <SelectItem 
                                key={role.id} 
                                value={role.id}
                                className="cursor-pointer hover:bg-gray-100 px-3 py-2"
                              >
                                {role.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-roles" disabled className="px-3 py-2 text-gray-500">
                              No roles available for this department
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">No staff record</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {users.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No users found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
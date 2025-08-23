'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users as FiUsers, users as Fiusers, Shield as FiShield, Home as FiHome, ArrowLeft as FiArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  Staff?: Array<{
    id: string;
    Role?: {
      id: number;
      title: string;
    };
    Department?: {
      id: number;
      name: string;
    };
  }>;
}

interface Role {
  id: number;
  title: string;
  Department?: {
    id: number;
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
}

export default function UserRoleAssignmentContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Selection states
  const [selectedusers, setSelectedUser] = useState<string>('');
  const [selectedrole, setSelectedRole] = useState<string>('');
  const [selecteddepartment, setSelectedDepartment] = useState<string>('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, departmentFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [usersRes, rolesRes, departmentsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
        fetch('/api/departments')
      ]);

      if (usersRes.ok) {
        const usersResponse = await usersRes.json();
        setUsers(usersResponse.data ?? []);
      }

      if (rolesRes.ok) {
        const rolesResponse = await rolesRes.json();
        setRoles(rolesResponse.data ?? []);
      }

      if (departmentsRes.ok) {
        const departmentsResponse = await departmentsRes.json();
        setDepartments(departmentsResponse.data ?? []);
      }
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search by name or email
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter(user => 
        user.staff?.some(staff => staff.role?.title === roleFilter)
      );
    }

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter(user => 
        user.staff?.some(staff => staff.department?.name === departmentFilter)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleAssignment = async () => {
    if (!selectedUser || !selectedRole) {
      setMessage({ type: 'error', text: 'Please select both user and role' });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/user/admin-update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedusers,
          roleId: selectedrole,
          departmentId: selectedDepartment ?? null
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Role assignment successful' });
        setSelectedUser('');
        setSelectedRole('');
        setSelectedDepartment('');
        loadData(); // Reload data to reflect changes
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Assignment failed' });
      }
    } catch (error: unknown) {
      console.error('Error assigning role:', error);
      setMessage({ type: 'error', text: 'Assignment failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/settings/role-hierarchy"
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <FiArrowLeft className="w-5 h-5 mr-2" />
          Back to Role Hierarchy
        </Link>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            User Role Assignment
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign users to roles and departments
          </p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-destructive/10 text-destructive border border-destructive'
        }`}>
          {message.text}
        </div>
      )}

      {/* Assignment Form */}
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Assign Role to User</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Choose a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.email} - {user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Choose a role...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id.toString()}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Department (Optional)
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Choose a department...</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleAssignment}
            disabled={submitting || !selectedUser || !selectedRole}
            className="bg-primary text-foreground px-4 py-2 rounded-md hover:bg-primary disabled:opacity-50"
          >
            {submitting ? 'Assigning...' : 'Assign Role'}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-card shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Search & Filter Users</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search Users
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.title}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Filter by Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-card shadow rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">
            Users ({filteredUsers.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredUsers.map(user => (
            <div key={user.id} className="p-6 hover:bg-muted">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <FiUser className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-foreground">
                      {user.name || 'No Name'}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {user.staff && user.staff.length > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {user.staff[0].role?.title || 'No Role'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.staff[0].department?.name || 'No Department'}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => setSelectedUser(user.id)}
                    className="text-primary hover:text-primary text-sm"
                  >
                    Select
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              No users found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
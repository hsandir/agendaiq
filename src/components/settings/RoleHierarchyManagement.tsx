'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Role {
  id: string;
  title: string;
  priority?: number;
  category?: string;
  department_id?: string;
  Department?: {
    id: string;
    name: string;
  };
  Staff?: Array<{
    id: string;
    User: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export function RoleHierarchyManagement() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSubordinates, setSelectedSubordinates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing roles
  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) {
        throw new Error('Failed to fetch roles');
      }
      const data = await res.json();
      setRoles(data);
    } catch (error: unknown) {
      setError('Failed to fetch roles');
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleInitializeRoles = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/roles/init', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to initialize roles');
      }

      setSuccess('Default roles initialized successfully');
      fetchRoles(); // Refresh the roles list
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to initialize roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newRoleName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add role');
      }

      setSuccess(`Successfully added role: ${newRoleName}`);
      setNewRoleName('');
      setSelectedSubordinates([]);
      fetchRoles(); // Refresh the roles list
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to add role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleTitle: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/roles/${encodeURIComponent(roleTitle)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete role');
      }

      setSuccess(`Successfully deleted role: ${roleTitle}`);
      fetchRoles(); // Refresh the roles list
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to delete role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Role Management</h3>
          <button
            onClick={handleInitializeRoles}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-foreground bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? 'Initializing...' : 'Initialize Default Roles'}
          </button>
        </div>

        <form onSubmit={handleAddRole} className="space-y-4">
          <div>
            <label htmlFor="roleName" className="block text-sm font-medium text-foreground">
              Role Name
            </label>
            <input
              type="text"
              id="roleName"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
              placeholder="Enter role name"
              required
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-foreground bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
          >
            {isLoading ? 'Adding Role...' : 'Add Role'}
          </button>
        </form>
      </div>

      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Existing Roles</h3>
        <div className="space-y-4">
          {roles.map((role, index) => (
            <div key={`role-${role.id}-${index}`} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-medium">{role.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Department: {role.Department?.name ?? 'None'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Priority: {role.priority || 'Not set'}
                </p>
                {role.Staff && role.Staff.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Staff: {role.Staff.length} member{role.Staff.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteRole(role.title)}
                className="px-3 py-1 text-sm text-destructive hover:text-destructive focus:outline-none"
                disabled={isLoading}
              >
                Delete
              </button>
            </div>
          ))}
          {roles.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No roles found. Click "Initialize Default Roles" to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
} 
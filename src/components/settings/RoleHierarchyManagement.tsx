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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    priority: '',
    category: '',
    department_id: ''
  });
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setEditForm({
      title: role.title,
      priority: role.priority?.toString() || '',
      category: role.category || '',
      department_id: role.department_id || ''
    });
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          priority: editForm.priority ? parseInt(editForm.priority) : undefined,
          category: editForm.category || undefined,
          department_id: editForm.department_id || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update role');
      }

      setSuccess(`Successfully updated role: ${editForm.title}`);
      setEditingRole(null);
      setEditForm({ title: '', priority: '', category: '', department_id: '' });
      fetchRoles(); // Refresh the roles list
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Role Management</h3>
          <button
            onClick={handleInitializeRoles}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading ? 'Initializing...' : 'Initialize Default Roles'}
          </button>
        </div>

        <form onSubmit={handleAddRole} className="space-y-4">
          <div>
            <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">
              Role Name
            </label>
            <input
              type="text"
              id="roleName"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter role name"
              required
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Adding Role...' : 'Add Role'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Existing Roles</h3>
        <div className="space-y-4">
          {roles.map((role, index) => (
            <div key={`role-${role.id}-${index}`} className="border rounded-lg overflow-hidden">
              <div 
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedRole?.id === role.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => handleRoleClick(role)}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{role.title}</h4>
                  <p className="text-sm text-gray-500">
                    Department: {role.Department?.name || 'None'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Priority: {role.priority || 'Not set'}
                  </p>
                  {role.Staff && role.Staff.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Staff: {role.Staff.length} member{role.Staff.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditRole(role);
                    }}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRole(role.title);
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 focus:outline-none"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Selected Role Details */}
              {selectedRole?.id === role.id && (
                <div className="border-t bg-gray-50 p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Role Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">ID:</span> {role.id}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {role.category || 'Not set'}
                    </div>
                    <div>
                      <span className="font-medium">Department ID:</span> {role.department_id || 'Not set'}
                    </div>
                    {role.Staff && role.Staff.length > 0 && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Staff Members:</span>
                        <div className="mt-1 space-y-1">
                          {role.Staff.map((staff) => (
                            <div key={staff.id} className="text-gray-600 ml-4">
                              • {staff.User.name} ({staff.User.email})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {roles.length === 0 && (
            <p className="text-gray-500 text-center py-4">No roles found. Click "Initialize Default Roles" to get started.</p>
          )}
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Edit Role: {editingRole.title}</h3>
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700">
                  Role Title
                </label>
                <input
                  type="text"
                  id="editTitle"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editPriority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <input
                  type="number"
                  id="editPriority"
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter priority (lower = higher priority)"
                />
              </div>
              
              <div>
                <label htmlFor="editCategory" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  id="editCategory"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter category"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update Role'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRole(null);
                    setEditForm({ title: '', priority: '', category: '', department_id: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
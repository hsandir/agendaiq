'use client';

import { useState, useEffect } from 'react';
import type { Role, Department } from '.prisma/client';

interface RoleWithDepartment extends Role {
  department: Department;
}

interface RoleData {
  roles: RoleWithDepartment[];
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<RoleWithDepartment[]>([]);
  const [selectedParentRole, setSelectedParentRole] = useState<number | ''>('');
  const [selectedChildRole, setSelectedChildRole] = useState<number | ''>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const data: RoleData = await response.json();
      setRoles(data.roles);
    } catch (error) {
      setError('Failed to load roles');
      console.error('Error fetching roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedParentRole || !selectedChildRole) {
      setError('Please select both parent and child roles');
      return;
    }

    if (selectedParentRole === selectedChildRole) {
      setError('Parent and child roles cannot be the same');
      return;
    }

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentRole: selectedParentRole,
          childRole: selectedChildRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role hierarchy');
      }

      await fetchRoles();
      setSuccess('Role hierarchy updated successfully');
      setSelectedParentRole('');
      setSelectedChildRole('');
    } catch (error) {
      setError('Failed to update role hierarchy');
      console.error('Error updating role hierarchy:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Current Roles</h2>
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{role.title}</h3>
              <p className="text-sm text-gray-600">Department: {role.department.name}</p>
              <p className="text-sm text-gray-600">Priority: {role.priority}</p>
              {role.category && (
                <p className="text-sm text-gray-600">Category: {role.category}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Update Role Priority</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="parentRole" className="block text-sm font-medium text-gray-700">
              Parent Role
            </label>
            <select
              id="parentRole"
              value={selectedParentRole}
              onChange={(e) => setSelectedParentRole(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} ({role.department.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="childRole" className="block text-sm font-medium text-gray-700">
              Child Role
            </label>
            <select
              id="childRole"
              value={selectedChildRole}
              onChange={(e) => setSelectedChildRole(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} ({role.department.name})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{success}</h3>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Update Hierarchy
          </button>
        </form>
      </div>
    </div>
  );
} 
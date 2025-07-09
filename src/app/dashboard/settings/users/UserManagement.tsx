'use client';

import { useState } from 'react';

interface Staff {
  id: number;
  role: { id: number; title: string } | null;
  department: { id: number; name: string } | null;
}

interface User {
  id: number;
  name: string | null;
  email: string;
  staff: Staff[];
}

interface UserManagementProps {
  initialUsers: User[];
}

export default function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    try {
      const response = await fetch('/api/user/admin-update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleId: newRoleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === userId ? { ...user, staff: user.staff.map(staff => 
          staff.id === updatedUser.staff[0].id ? updatedUser.staff[0] : staff
        ) } : user
      ));
      setSuccess('Role updated successfully');
      setError('');
    } catch (error) {
      setError('Failed to update role');
      console.error('Error updating role:', error);
    }
  };

  const handleDepartmentChange = async (userId: number, newDepartmentId: number | null) => {
    try {
      const response = await fetch('/api/user/admin-update-department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, departmentId: newDepartmentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update department');
      }

      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === userId ? { ...user, staff: user.staff.map(staff => 
          staff.id === updatedUser.staff[0].id ? updatedUser.staff[0] : staff
        ) } : user
      ));
      setSuccess('Department updated successfully');
      setError('');
    } catch (error) {
      setError('Failed to update department');
      console.error('Error updating department:', error);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Users</h3>
            <span className="text-sm text-gray-500">{users.length} total users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name || 'No name'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={user.staff[0]?.role?.id || ''}
                        onChange={(e) => handleRoleChange(user.id, Number(e.target.value))}
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select role</option>
                        {/* Add role options here */}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={user.staff[0]?.department?.id || ''}
                        onChange={(e) => handleDepartmentChange(user.id, Number(e.target.value) || null)}
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Not assigned</option>
                        {/* Add department options here */}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleRoleChange(user.id, user.staff[0]?.role?.id || 0)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 
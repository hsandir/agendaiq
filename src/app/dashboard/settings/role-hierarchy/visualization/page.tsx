'use client';

import { useState } from 'react';
import RoleHierarchyVisualization from '@/components/settings/RoleHierarchyVisualization';

interface Role {
  id: string;
  title: string;
  level: number;
  is_leadership: boolean;
  category: string;
  Department?: {
    id: string;
    name: string;
  };
  Children?: Role[];
  Staff?: Array<{
    id: string;
    User: {
      name: string;
      email: string;
    };
  }>;
}

export default function RoleHierarchyVisualizationPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Role Hierarchy Visualization
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Visualize and explore the organizational role hierarchy
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RoleHierarchyVisualization onRoleSelect={handleRoleSelect} />
          </div>
          
          {selectedRole && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Role Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRole.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRole.level}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRole.category}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRole.Department?.name || 'No Department'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Leadership Role</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRole.is_leadership ? 'Yes' : 'No'}
                    </p>
                  </div>
                  
                  {selectedRole.Staff && selectedRole.Staff.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Staff Members ({selectedRole.Staff.length})
                      </label>
                      <div className="mt-2 space-y-2">
                        {selectedRole.Staff.map((staff) => (
                          <div key={staff.id} className="text-sm text-gray-900">
                            <div className="font-medium">{staff.User.name}</div>
                            <div className="text-gray-500">{staff.User.email}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedRole.Children && selectedRole.Children.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Subordinate Roles ({selectedRole.Children.length})
                      </label>
                      <div className="mt-2 space-y-1">
                        {selectedRole.Children.map((child) => (
                          <div key={child.id} className="text-sm text-gray-900">
                            {child.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
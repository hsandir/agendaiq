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
    users: {
      name: string;
      email: string;
    };
  }>;
}

export default function RoleHierarchyVisualizationContent() {
  const [selectedrole, setSelectedRole] = useState<Role | null>(null);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            Role Hierarchy Visualization
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize and explore the organizational role hierarchy
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="w-full">
          <RoleHierarchyVisualization onRoleSelect={handleRoleSelect} />
        </div>
        
        {selectedRole && (
          <div className="mt-6">
            <div className="bg-card rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Role Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Title</label>
                  <p className="mt-1 text-sm text-foreground">{selectedRole.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground">Level</label>
                  <p className="mt-1 text-sm text-foreground">{selectedRole.level}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground">Category</label>
                  <p className="mt-1 text-sm text-foreground">{selectedRole.category}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground">Department</label>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedRole.department?.name || 'No Department'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground">Leadership Role</label>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedRole.is_leadership ? 'Yes' : 'No'}
                  </p>
                </div>
                
                {selectedRole.staff && selectedRole.staff.length > 0 && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-foreground">
                      Staff Members ({selectedRole.staff.length})
                    </label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedRole.staff.map((staff) => (
                        <div key={staff.id} className="text-sm text-foreground bg-muted p-2 rounded">
                          <div className="font-medium">{staff.users.name}</div>
                          <div className="text-muted-foreground">{staff.users.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedRole.Children && selectedRole.Children.length > 0 && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-foreground">
                      Subordinate Roles ({selectedRole.Children.length})
                    </label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedRole.Children.map((child) => (
                        <div key={child.id} className="text-sm text-foreground bg-muted p-2 rounded">
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
    </>
  );
} 
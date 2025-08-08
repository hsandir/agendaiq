"use client";

import React, { useState } from 'react';
import DragDropRoleDistribution from './DragDropRoleDistribution';
import { useRouter } from 'next/navigation';

interface Role {
  id: number;
  title: string;
  priority: number;
  is_leadership: boolean;
  _count?: {
    Staff: number;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Props {
  departments: Department[];
  roles: Role[];
}

export default function RolesPageClient({ departments, roles }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSaveRoleAssignments = async (updatedRoles: Role[]) => {
    setIsSaving(true);
    
    try {
      // Convert Role[] to the format expected by the API
      const updates = updatedRoles.map(role => ({
        roleId: role.id,
        departmentId: null // Since department_id isn't part of the Role interface
      }));

      const response = await fetch('/api/roles/department-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments: updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save role assignments');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error saving role assignments:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DragDropRoleDistribution
      roles={roles}
      onSave={handleSaveRoleAssignments}
    />
  );
}
"use client";

import React, { useState } from 'react';
import DragDropRoleDistribution from './DragDropRoleDistribution';
import { useRouter } from 'next/navigation';

interface Role {
  id: number;
  title: string;
  priority: number;
  is_leadership: boolean;
  department_id: number | null;
  Staff: { id: number }[];
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

  const handleSaveRoleAssignments = async (updates: { roleId: number; departmentId: number | null }[]) => {
    setIsSaving(true);
    
    try {
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
      departments={departments}
      availableRoles={roles}
      onSave={handleSaveRoleAssignments}
    />
  );
}
"use client";

import React, { useState } from 'react';
import StaffRoleDragDrop from './StaffRoleDragDrop';
import { useRouter } from 'next/navigation';

interface StaffMember {
  id: number;
  users: {
    id: number;
    name: string | null;
    email: string;
    image?: string | null;
    email_verified: boolean;
  };
  role_id: number;
  department: {
    id: number;
    name: string;
  } | null;
}

interface Role {
  id: number;
  title: string;
  priority: number;
  is_leadership: boolean;
  department_id?: number | null;
  staff: StaffMember[];
}

interface Department {
  id: number;
  name: string;
  code: string;
  staff: StaffMember[];
}

interface Props {
  departments: Department[];
  roles: Role[];
}

export default function RolesPageClient({ departments, roles }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSaveStaffRoleAssignments = async (updates: { staffId: number; newRoleId: number }[]) => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/staff/role-assignments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments: updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save staff role assignments');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error: unknown) {
      console.error('Error saving staff role assignments:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StaffRoleDragDrop
      initialRoles={roles}
      onSave={handleSaveStaffRoleAssignments}
    />
  );
}
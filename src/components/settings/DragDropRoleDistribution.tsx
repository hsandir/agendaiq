"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, ChevronUp, ChevronDown, Save, RefreshCw } from 'lucide-react';

interface Role {
  id: number;
  title: string;
  priority: number;
  is_leadership: boolean;
  _count?: {
    staff: number
  };
}

interface DragDropRoleDistributionProps {
  roles: Role[];
  onReorder?: (roles: Role[]) => void;
  onSave?: (roles: Role[]) => Promise<void>;
}

export default function DragDropRoleDistribution({ 
  roles: initialRoles, 
  onReorder,
  onSave 
}: DragDropRoleDistributionProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  const moveRole = (index: number, direction: 'up' | 'down') => {
    const newRoles = [...roles];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 ?? newIndex >= roles.length) return;
    
    // Swap the roles
    [newRoles[index], newRoles[newIndex]] = [newRoles[newIndex], newRoles[index]];
    
    // Update priorities
    const updatedRoles = (newRoles.map((role, idx) => ({
      ...role,
      priority: idx + 1
    })));
    
    setRoles(updatedRoles);
    setHasChanges(true);
    
    if (onReorder) {
      onReorder(updatedRoles);
    }
  };

  const handleSave = async () => {
    if (!onSave || !hasChanges) return;
    
    setIsSaving(true);
    try {
      await onSave(roles);
      setHasChanges(false);
    } catch (error: unknown) {
      console.error('Failed to save role order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRoles(initialRoles);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Role Hierarchy</h3>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-foreground rounded-md hover:bg-primary disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {roles.map((role, index) => (
          <div
            key={role.id}
            className="flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveRole(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveRole(index, 'down')}
                  disabled={index === roles.length - 1}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {role.is_leadership ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <Users className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">{role.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Priority: {role.priority} • {role._count?.staff ?? 0} staff members
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>
      
      {roles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No roles available
        </div>
      )}
    </div>
  );
}
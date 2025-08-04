"use client";

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Shield, Users, GripVertical, Save, RefreshCw } from 'lucide-react';

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
  roles?: Role[];
}

interface Props {
  departments: Department[];
  availableRoles: Role[];
  onSave: (updatedAssignments: { roleId: number; departmentId: number | null }[]) => Promise<void>;
}

// Sortable Role Item
function SortableRoleItem({ role, isDragging }: { role: Role; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: role.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-all ${
        isSortableDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-gray-100 rounded p-1"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex items-center space-x-2">
          {role.is_leadership ? (
            <Shield className="h-4 w-4 text-blue-600" />
          ) : (
            <Users className="h-4 w-4 text-gray-600" />
          )}
          <span className="text-sm font-medium">{role.title}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Priority: {role.priority}</span>
        {role.Staff.length > 0 && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            {role.Staff.length} staff
          </span>
        )}
      </div>
    </div>
  );
}

// Droppable Department Container
function DroppableDepartment({ 
  department, 
  roles, 
  isOver 
}: { 
  department: Department; 
  roles: Role[]; 
  isOver: boolean 
}) {
  return (
    <div
      className={`p-4 border-2 rounded-lg transition-all ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <h4 className="font-medium mb-3 flex items-center justify-between">
        <span>{department.name}</span>
        <span className="text-xs text-gray-500">{roles.length} roles</span>
      </h4>
      <div className="space-y-2 min-h-[100px]">
        <SortableContext
          items={roles.map(r => r.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {roles.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Drop roles here
            </div>
          ) : (
            roles.map((role) => (
              <SortableRoleItem key={role.id} role={role} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function DragDropRoleDistribution({ departments, availableRoles, onSave }: Props) {
  const [roleAssignments, setRoleAssignments] = useState<Map<number, number | null>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize role assignments
  useEffect(() => {
    const assignments = new Map<number, number | null>();
    availableRoles.forEach(role => {
      assignments.set(role.id, role.department_id);
    });
    setRoleAssignments(assignments);
  }, [availableRoles]);

  // Get roles for a department
  const getRolesForDepartment = (deptId: number | null): Role[] => {
    return availableRoles.filter(role => roleAssignments.get(role.id) === deptId);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeRoleId = parseInt(active.id as string);
    const overId = over.id as string;

    // Determine target department
    let targetDeptId: number | null = null;
    
    if (overId === 'unassigned') {
      targetDeptId = null;
    } else if (overId.startsWith('dept-')) {
      targetDeptId = parseInt(overId.replace('dept-', ''));
    } else {
      // Dropped on another role - find its department
      const overRoleId = parseInt(overId);
      targetDeptId = roleAssignments.get(overRoleId) ?? null;
    }

    // Update assignment
    const newAssignments = new Map(roleAssignments);
    newAssignments.set(activeRoleId, targetDeptId);
    setRoleAssignments(newAssignments);
    setIsDirty(true);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    const updates: { roleId: number; departmentId: number | null }[] = [];
    
    roleAssignments.forEach((deptId, roleId) => {
      const originalRole = availableRoles.find(r => r.id === roleId);
      if (originalRole?.department_id !== deptId) {
        updates.push({ roleId, departmentId: deptId });
      }
    });

    try {
      await onSave(updates);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset changes
  const handleReset = () => {
    const assignments = new Map<number, number | null>();
    availableRoles.forEach(role => {
      assignments.set(role.id, role.department_id);
    });
    setRoleAssignments(assignments);
    setIsDirty(false);
  };

  const activeRole = activeId ? availableRoles.find(r => r.id === parseInt(activeId)) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Drag & Drop Role Distribution</h3>
        {isDirty && (
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2 inline" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Unassigned Roles */}
          <div
            id="unassigned"
            className={`droppable ${overId === 'unassigned' ? 'over' : ''}`}
          >
            <DroppableDepartment
              department={{ id: 0, name: 'Unassigned Roles', code: 'UNASSIGNED', roles: [] }}
              roles={getRolesForDepartment(null)}
              isOver={overId === 'unassigned'}
            />
          </div>

          {/* Departments */}
          {departments.map((dept) => (
            <div
              key={dept.id}
              id={`dept-${dept.id}`}
              className={`droppable ${overId === `dept-${dept.id}` ? 'over' : ''}`}
            >
              <DroppableDepartment
                department={dept}
                roles={getRolesForDepartment(dept.id)}
                isOver={overId === `dept-${dept.id}`}
              />
            </div>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeRole ? (
            <div className="flex items-center justify-between p-3 bg-white border-2 border-blue-500 rounded-lg shadow-xl">
              <div className="flex items-center space-x-3">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <div className="flex items-center space-x-2">
                  {activeRole.is_leadership ? (
                    <Shield className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Users className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium">{activeRole.title}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
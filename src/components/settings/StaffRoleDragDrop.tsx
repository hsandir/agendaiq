"use client";

import React, { useState, useCallback } from 'react';
import { DndContext, DragOverlay, closestCenter, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Crown, 
  Shield, 
  GripVertical, 
  Check, 
  X, 
  AlertTriangle,
  Save,
  Undo2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

interface StaffRoleDragDropProps {
  initialRoles: Role[];
  onSave?: (updatedStaff: { staffId: number; newRoleId: number }[]) => Promise<void>;
}

interface DraggableStaffCardProps {
  staff: StaffMember;
  isDragging?: boolean;
}

// Draggable staff member card
function DraggableStaffCard({ staff, isDragging }: DraggableStaffCardProps) {
  const {
    _attributes,
    _listeners,
    _setNodeRef,
    _transform,
    _transition,
    isDragging: _isSortableDragging,
  } = useSortable({ id: staff._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 cursor-grab active:cursor-grabbing group"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
      <Avatar className="h-8 w-8">
        <AvatarImage src={staff.users.image || undefined} />
        <AvatarFallback className="text-xs">
          {staff.users.name?.charAt(0) || staff.users.email.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {staff.users.name || staff.users.email.split('@')[0]}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {staff.users.email}
        </p>
        {staff.department && (
          <p className="text-xs text-muted-foreground truncate">
            {staff.department.name}
          </p>
        )}
      </div>
      {!staff.users.email_verified && (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      )}
    </div>
  );
}

// Droppable role container
function RoleContainer({ role, children }: { role: Role; children: React.ReactNode }) {
  const getRoleIcon = () => {
    if (role.is_leadership) return <Crown className="h-4 w-4 text-yellow-600" />;
    return <Users className="h-4 w-4 text-muted-foreground" />;
  };

  const getRoleBadgeVariant = () => {
    if (role.is_leadership) return 'default';
    return 'secondary';
  };

  return (
    <Card className="min-h-[200px]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getRoleIcon()}
            <CardTitle className="text-base truncate">{role.title}</CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Badge variant={getRoleBadgeVariant()} className="text-xs">
                P{role.priority}
              </Badge>
              {role.is_leadership && (
                <Badge variant="default" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Lead
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {role.staff.length} staff
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {children}
        {role.staff.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No staff assigned</p>
            <p className="text-xs">Drop staff here to assign</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StaffRoleDragDrop({ initialRoles, onSave }: StaffRoleDragDropProps) {
  const { _toast } = useToast();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [changes, setChanges] = useState<{ staffId: number; oldRoleId: number; newRoleId: number }[]>([]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const staffId = event.active.id as number;
    const staff = roles.flatMap(role => role.staff).find(s => s.id === staffId);
    setActiveStaff(staff || null);
  }, [roles]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { _active, _over } = event;
    setActiveStaff(null);

    if (!over) return;

    const staffId = active.id as number;
    const newRoleId = over.id as number;

    // Find current staff and role
    let currentStaff: StaffMember | null = null;
    let currentRoleId: number | null = null;

    for (const role of roles) {
      const staff = role.staff.find(s => s.id === staffId);
      if (staff) {
        currentStaff = staff;
        currentRoleId = role.id;
        break;
      }
    }

    if (!currentStaff || !currentRoleId || currentRoleId === newRoleId) return;

    // Update roles state
    setRoles(prevRoles => {
      return prevRoles.map(role => {
        if (role.id === currentRoleId) {
          // Remove staff from current role
          return {
            ...role,
            staff: role.staff.filter(s => s.id !== staffId)
          };
        } else if (role.id === newRoleId) {
          // Add staff to new role
          return {
            ...role,
            staff: [...role.staff, { ...currentStaff!, role_id: newRoleId }]
          };
        }
        return role;
      });
    });

    // Track changes
    setChanges(prev => {
      const existing = prev.find(c => c.staffId === staffId);
      if (existing) {
        // Update existing change
        return prev.map(c => 
          c.staffId === staffId 
            ? { ...c, newRoleId } 
            : c
        );
      } else {
        // Add new change
        return [...prev, { 
          staffId, 
          oldRoleId: currentRoleId!, 
          newRoleId 
        }];
      }
    });

    setHasChanges(true);
  }, [roles]);

  const handleSave = async () => {
    if (!onSave || changes.length === 0) return;

    setIsSaving(true);
    try {
      await onSave(changes.map(c => ({ staffId: c.staffId, newRoleId: c.newRoleId })));
      setChanges([]);
      setHasChanges(false);
      toast({
        title: "Success",
        description: `Successfully updated ${changes.length} staff assignment${changes.length !== 1 ? 's' : ''}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to save role assignments',
        variant: "destructive"
      });
      console.error('Error saving role assignments:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRoles(initialRoles);
    setChanges([]);
    setHasChanges(false);
    toast({
      title: "Changes Reset",
      description: 'All changes have been reset to original state'
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You have {changes.length} unsaved change{changes.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleReset}>
                <Undo2 className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Drag and Drop Context */}
      <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Role Containers Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map(role => (
            <SortableContext
              key={role.id}
              id={role.id.toString()}
              items={role.staff.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <RoleContainer role={role}>
                {role.staff.map(staff => (
                  <DraggableStaffCard key={staff.id} staff={staff} />
                ))}
              </RoleContainer>
            </SortableContext>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeStaff && (
            <DraggableStaffCard staff={activeStaff} isDragging />
          )}
        </DragOverlay>
      </DndContext>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Staff</span>
            </div>
            <p className="text-2xl font-bold">
              {roles.reduce((acc, role) => acc + role.staff.length, 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Leadership Roles</span>
            </div>
            <p className="text-2xl font-bold">
              {roles.filter(r => r.is_leadership).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Regular Roles</span>
            </div>
            <p className="text-2xl font-bold">
              {roles.filter(r => !r.is_leadership).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
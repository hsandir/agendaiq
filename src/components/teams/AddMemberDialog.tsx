'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Staff {
  id: number;
  user_id: number;
  users: {
    id: number;
    name: string | null;
    email: string;
    image: string | null;
  };
  role: {
    id: number;
    title: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  currentMembers: number[]; // Array of staff IDs already in team
  onMembersAdded: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  teamId,
  currentMembers,
  onMembersAdded,
}: AddMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [role, setRole] = useState<'MEMBER' | 'LEAD'>('MEMBER');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableStaff();
    }
  }, [open]);

  const fetchAvailableStaff = async () => {
    setLoading(true);
    try {
      // Fetch all staff from the organization
      const response = await fetch('/api/staff', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch staff: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter out staff already in the team
      const available = data.staff.filter(
        (s: Staff) => !currentMembers.includes(s.id)
      );
      
      setAvailableStaff(available);
    } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching staff:', error);
      toast.error(`Failed to load available staff: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Transform staff to MultiSelectOptions (same as MeetingFormStep1)
  const attendeeOptions: MultiSelectOption[] = availableStaff.map(staff => ({
    value: staff.id.toString(),
    label: staff.users.name || staff.users.email,
    email: staff.users.email,
    department: staff.department?.name || null,
    role: staff.role.title || null
  }));

  const handleAddMembers = async () => {
    if (selectedStaffIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setSubmitting(true);
    
    try {
      // Add each selected member to the team
      const promises = selectedStaffIds.map(staffIdStr =>
        fetch(`/api/teams/${teamId}/members`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staff_id: parseInt(staffIdStr),
            role: role,
          }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length > 0) {
        toast.error(`Failed to add ${failed.length} member(s)`);
      } else {
        toast.success(`Successfully added ${selectedStaffIds.length} member(s)`);
        onMembersAdded();
        onOpenChange(false);
        // Reset state
        setSelectedStaffIds([]);
        setRole('MEMBER');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Failed to add members');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Team Members</DialogTitle>
          <DialogDescription>
            Select staff members to add to the team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Staff Selection using MultiSelect */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading staff...</span>
              </div>
            ) : (
              <MultiSelect
                options={attendeeOptions}
                selected={selectedStaffIds}
                onChange={(newSelection) => {
                  console.log("Staff selected:", newSelection);
                  setSelectedStaffIds(newSelection);
                }}
                placeholder="Select staff members..."
                label="Team Members"
                showSearch={true}
                showDepartmentFilter={false}
                showRoleFilter={false}
                maxHeight="300px"
              />
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Member Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as 'MEMBER' | 'LEAD')}
              disabled={submitting}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="LEAD">Team Lead</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Team Leads have full management permissions for the team
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMembers}
            disabled={submitting || selectedStaffIds.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add {selectedStaffIds.length > 0 && `(${selectedStaffIds.length})`} Members
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Check, ChevronsUpDown, UserPlus, X } from 'lucide-react';
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
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      
      const data = await response.json();
      
      // Filter out staff already in the team
      const available = data.staff.filter(
        (s: Staff) => !currentMembers.includes(s.id)
      );
      
      setAvailableStaff(available);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load available staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedStaff.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setSubmitting(true);
    
    try {
      // Add each selected member to the team
      const promises = selectedStaff.map(staffId =>
        fetch(`/api/teams/${teamId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staff_id: staffId,
            role: role,
          }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length > 0) {
        toast.error(`Failed to add ${failed.length} member(s)`);
      } else {
        toast.success(`Successfully added ${selectedStaff.length} member(s)`);
        onMembersAdded();
        onOpenChange(false);
        // Reset state
        setSelectedStaff([]);
        setRole('MEMBER');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Failed to add members');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStaffSelection = (staffId: number) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const removeSelectedStaff = (staffId: number) => {
    setSelectedStaff(prev => prev.filter(id => id !== staffId));
  };

  const filteredStaff = availableStaff.filter(staff => {
    const searchLower = searchQuery.toLowerCase();
    const name = staff.users.name?.toLowerCase() || '';
    const email = staff.users.email.toLowerCase();
    const role = staff.role.title.toLowerCase();
    const dept = staff.department?.name.toLowerCase() || '';
    
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      role.includes(searchLower) ||
      dept.includes(searchLower)
    );
  });

  const selectedStaffDetails = selectedStaff.map(id =>
    availableStaff.find(s => s.id === id)
  ).filter(Boolean) as Staff[];

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
          {/* Staff Selection */}
          <div className="space-y-2">
            <Label>Select Members</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                  disabled={loading}
                >
                  {loading ? (
                    <span>Loading staff...</span>
                  ) : (
                    <span>
                      {selectedStaff.length === 0
                        ? 'Select members...'
                        : `${selectedStaff.length} selected`}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[550px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search staff by name, email, role..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>No staff found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[300px]">
                      {filteredStaff.map((staff) => (
                        <CommandItem
                          key={staff.id}
                          onSelect={() => toggleStaffSelection(staff.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center w-full">
                            <Checkbox
                              checked={selectedStaff.includes(staff.id)}
                              className="mr-3"
                            />
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src={staff.users.image || undefined} />
                              <AvatarFallback>
                                {staff.users.name?.charAt(0) || staff.users.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium">
                                {staff.users.name || staff.users.email}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {staff.role.title}
                                {staff.department && ` • ${staff.department.name}`}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected Members Display */}
          {selectedStaffDetails.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Members ({selectedStaffDetails.length})</Label>
              <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                <div className="flex flex-wrap gap-2">
                  {selectedStaffDetails.map((staff) => (
                    <Badge
                      key={staff.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={staff.users.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {staff.users.name?.charAt(0) || staff.users.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{staff.users.name || staff.users.email}</span>
                      <button
                        onClick={() => removeSelectedStaff(staff.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

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
            disabled={submitting || selectedStaff.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add {selectedStaff.length > 0 && `(${selectedStaff.length})`} Members
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
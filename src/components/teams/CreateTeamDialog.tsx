'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Users, UserCheck, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeamFormData) => Promise<void>;
}

interface TeamFormData {
  name: string;
  description?: string;
  type: string;
  purpose: string;
  initial_members?: number[]; // staff_ids
}

interface StaffMember {
  id: number;
  users: {
    id: number;
    name: string | null;
    email: string;
    image?: string | null;
  };
  role: {
    id: number;
    title: string;
  };
  department: {
    id: number;
    name: string;
  };
}

const TEAM_TYPES = [
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'PROJECT', label: 'Project Team' },
  { value: 'COMMITTEE', label: 'Committee' },
  { value: 'SUBJECT', label: 'Subject Team' },
  { value: 'GRADE_LEVEL', label: 'Grade Level' },
  { value: 'SPECIAL', label: 'Special Team' },
];

export function CreateTeamDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTeamDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    type: 'DEPARTMENT',
    purpose: '',
    initial_members: [],
  });

  const fetchStaff = useCallback(async () => {
    try {
      setStaffLoading(true);
      const response = await fetch('/api/users?include=staff');
      
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json() as { users: Array<{ staff: StaffMember[] }> };
      setStaff(data.users.filter((user) => user.staff && user.staff.length > 0).map((user) => user.staff[0]));
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive',
      });
    } finally {
      setStaffLoading(false);
    }
  }, [toast]);

  // Fetch staff when dialog opens
  useEffect(() => {
    if (open) {
      void fetchStaff();
    }
  }, [open, fetchStaff]);


  const toggleMember = (staffId: number) => {
    setSelectedMembers(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const filteredStaff = staff.filter(member => 
    memberSearch === '' || 
    (member.users.name?.toLowerCase().includes(memberSearch.toLowerCase()) ?? false) ||
    member.users.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.role.title.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.department.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.purpose.trim()) {
      toast({
        title: 'Error',
        description: 'Team purpose is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Include selected members in form data
      const teamDataWithMembers = {
        ...formData,
        initial_members: selectedMembers.length > 0 ? selectedMembers : undefined,
      };
      
      await onSubmit(teamDataWithMembers);
      toast({
        title: 'Success',
        description: 'Team created successfully',
      });
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'DEPARTMENT',
        purpose: '',
        initial_members: [],
      });
      setSelectedMembers([]);
      setMemberSearch('');
      onOpenChange(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a team to collaborate with your colleagues
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="Enter team name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Team Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select team type" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="What is the main purpose of this team?"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                disabled={loading}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter team description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={loading}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Initial Team Members (Optional)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, email, role, or department..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  disabled={loading || staffLoading}
                  className="pl-10"
                />
              </div>
              {staffLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading staff...</span>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-48 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredStaff.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {memberSearch ? 'No members found matching your search' : 'No staff members available'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        filteredStaff.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                            onClick={() => toggleMember(member.id)}
                          >
                            <Checkbox
                              checked={selectedMembers.includes(member.id)}
                              onChange={() => toggleMember(member.id)}
                              disabled={loading}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.users.image ?? undefined} />
                              <AvatarFallback>
                                {member.users.name?.charAt(0) ?? member.users.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.users.name ?? member.users.email}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.role.title} • {member.department.name}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {member.role.title}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  {selectedMembers.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      <span>{selectedMembers.length} member{selectedMembers.length === 1 ? '' : 's'} selected</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserMinus, Search, Mail, User, Shield, Plus } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Attendee {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  role?: string;
  department?: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface MeetingAttendeeManagerProps {
  meetingId: number;
  currentAttendees: Attendee[];
  availableStaff: Staff[];
  onAttendeeChange?: (attendees: Attendee[]) => void;
  readOnly?: boolean;
}

function MeetingAttendeeManagerInternal({
  meetingId,
  currentAttendees,
  availableStaff,
  onAttendeeChange,
  readOnly = false
}: MeetingAttendeeManagerProps) {
  const [attendees, setAttendees] = useState<Attendee[]>(currentAttendees);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // Filter available staff (exclude already added attendees)
  const filteredStaff = availableStaff.filter(staff => {
    const alreadyAdded = attendees.some(attendee => attendee.id === staff.id);
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    return !alreadyAdded && matchesSearch;
  });

  // Add multiple attendees function with Zero Degradation Protocol
  const addMultipleAttendees = async (staffIds: string[]) => {
    if (readOnly || staffIds.length === 0) return;

    setIsLoading(true);
    
    try {
      // Add attendees one by one to maintain data integrity
      const newAttendees: Attendee[] = [];
      
      for (const staffId of staffIds) {
        const staff = availableStaff.find(s => s.id === staffId);
        if (!staff) continue;

        const response = await fetch(`/api/meetings/${meetingId}/attendees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId: parseInt(staffId) })
        });

        if (response.ok) {
          const newAttendee: Attendee = {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            status: 'pending',
            role: staff.role,
            department: staff.department
          };
          newAttendees.push(newAttendee);
        } else {
          // Enhanced error logging for individual attendee - Zero Degradation Protocol
          const errorData: { error?: string } = await (response.json() as Promise<{ error?: string }>).catch((): { error: string } => ({ error: 'Unknown error' }));
          console.error(`Failed to add attendee ${staff.name} (${staff.id}):`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            staffId,
            meetingId,
            url: `/api/meetings/${meetingId}/attendees`
          });
        }
      }

      if (newAttendees.length > 0) {
        const updatedAttendees = [...attendees, ...newAttendees];
        setAttendees(updatedAttendees);
        onAttendeeChange?.(updatedAttendees);
      }

      // Reset form
      setSelectedStaffIds([]);
      setSearchTerm('');
      setIsDialogOpen(false);
      
    } catch (error) {
      console.error('Error adding multiple attendees:', error);
    } finally {
      setIsLoading(false);
    }
  };


  // Remove attendee function with Zero Degradation Protocol
  const removeAttendee = async (attendeeId: string) => {
    if (readOnly) return;

    setIsLoading(true);
    
    try {
      // API call to remove attendee
      const response = await fetch(`/api/meetings/${meetingId}/attendees/${attendeeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedAttendees = attendees.filter(a => a.id !== attendeeId);
        setAttendees(updatedAttendees);
        onAttendeeChange?.(updatedAttendees);
      } else {
        console.error('Failed to remove attendee');
      }
    } catch (error) {
      console.error('Error removing attendee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle staff selection in dialog
  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  // Update attendee status
  const updateAttendeeStatus = async (attendeeId: string, status: 'pending' | 'accepted' | 'declined') => {
    if (readOnly) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/meetings/${meetingId}/attendees/${attendeeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const updatedAttendees = attendees.map(attendee =>
          attendee.id === attendeeId ? { ...attendee, status } : attendee
        );
        setAttendees(updatedAttendees);
        onAttendeeChange?.(updatedAttendees);
      }
    } catch (error) {
      console.error('Error updating attendee status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Meeting Attendees ({attendees.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!readOnly && (
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Attendees
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Meeting Attendees</DialogTitle>
                  <DialogDescription>
                    Select staff members to invite to this meeting. You can search by name or email.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search staff by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Selected Count */}
                  {selectedStaffIds.length > 0 && (
                    <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg border">
                      <span className="text-sm font-medium">
                        {selectedStaffIds.length} staff member(s) selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStaffIds([])}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}

                  {/* Staff List */}
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {filteredStaff.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No available staff found</p>
                        {searchTerm && <p className="text-xs mt-1">Try adjusting your search terms</p>}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredStaff.map((staff) => (
                          <div
                            key={staff.id}
                            onClick={() => toggleStaffSelection(staff.id)}
                            className={`flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedStaffIds.includes(staff.id) ? 'bg-primary/10 border-l-4 border-primary' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                selectedStaffIds.includes(staff.id) 
                                  ? 'bg-primary border-primary text-primary-foreground' 
                                  : 'border-muted-foreground/30'
                              }`}>
                                {selectedStaffIds.includes(staff.id) && (
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                )}
                              </div>
                              
                              <div className="h-10 w-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              
                              <div>
                                <p className="font-medium">{staff.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {staff.email}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <Badge variant="secondary" className="mb-1">
                                {staff.role}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{staff.department}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => addMultipleAttendees(selectedStaffIds)}
                      disabled={selectedStaffIds.length === 0 || isLoading}
                    >
                      {isLoading ? 'Adding...' : `Add ${selectedStaffIds.length} Attendee${selectedStaffIds.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Current Attendees */}
        <div>
          <Label>Current Attendees</Label>
          <div className="mt-2 space-y-2">
            {attendees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No attendees added yet</p>
              </div>
            ) : (
              attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{attendee.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {attendee.email}
                        {attendee.role && (
                          <>
                            <span>•</span>
                            <Shield className="h-3 w-3" />
                            {attendee.role}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <Select
                        value={attendee.status}
                        onValueChange={(status: 'pending' | 'accepted' | 'declined') =>
                          updateAttendeeStatus(attendee.id, status)
                        }
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    <Badge
                      variant={
                        attendee.status === 'accepted'
                          ? 'default'
                          : attendee.status === 'declined'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {attendee.status}
                    </Badge>

                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttendee(attendee.id)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total Attendees: {attendees.length}</span>
            <div className="flex gap-4">
              <span>Accepted: {attendees.filter(a => a.status === 'accepted').length}</span>
              <span>Pending: {attendees.filter(a => a.status === 'pending').length}</span>
              <span>Declined: {attendees.filter(a => a.status === 'declined').length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Zero Degradation Protocol - Error boundary wrapper
export function MeetingAttendeeManager(props: MeetingAttendeeManagerProps) {
  return (
    <ErrorBoundary
      title="Attendee Management Error"
      showDetails={false}
      onError={(error, errorInfo) => {
        console.error('MeetingAttendeeManager error:', error, errorInfo);
      }}
    >
      <MeetingAttendeeManagerInternal {...props} />
    </ErrorBoundary>
  );
}
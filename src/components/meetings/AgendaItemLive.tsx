"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Save, 
  X,
  User,
  AlertCircle,
  Clock,
  MessageSquare,
  Paperclip
} from "lucide-react";
import type { MeetingAgendaItem, Staff, User as PrismaUser } from "@prisma/client";
import { usePusherChannel } from "@/hooks/usePusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";
import { AgendaItemComments } from "./AgendaItemComments";
import { CreateMeetingModal } from "./CreateMeetingModal";
import Link from "next/link";

interface ExtendedAgendaItem extends MeetingAgendaItem {
  ResponsibleStaff?: (Staff & { User: PrismaUser }) | null;
  Comments: Record<string, unknown>[];
  ActionItems: Record<string, unknown>[];
}

interface Props {
  item: ExtendedAgendaItem;
  staff: (Staff & { User: PrismaUser })[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<MeetingAgendaItem>) => void;
  canEdit: boolean;
  currentUserId?: number;
  currentUserName?: string;
  meetingId?: number;
}

export function AgendaItemLive({ 
  item, 
  staff, 
  isExpanded, 
  onToggleExpand, 
  onUpdate,
  canEdit,
  currentUserId,
  currentUserName,
  meetingId
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [editData, setEditData] = useState({
    topic: item.topic,
    problem_statement: item.problem_statement ?? '',
    proposed_solution: item.proposed_solution ?? '',
    decisions_actions: item.decisions_actions ?? '',
    status: item.status,
    priority: item.priority,
    responsible_staff_id: item.responsible_staff_id,
    purpose: item.purpose ?? 'Discussion',
    solution_type: item.solution_type ?? null,
    decision_type: item.decision_type ?? null,
    future_implications: item.future_implications ?? false
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channel = usePusherChannel(meetingId ? CHANNELS.meeting(meetingId) : null);

  const handleSave = () => {
    // Check if status changed to "Assigned_to_local"
    if (editData.status === 'Assigned_to_local' && item.status !== 'Assigned_to_local') {
      setShowAssignDialog(true);
      return;
    }
    
    onUpdate(editData);
    setIsEditing(false);
    emitStoppedTyping();
  };
  
  const handleAssignToLocal = (action: 'email' | 'meeting' | 'skip') => {
    if (action === 'meeting') {
      // Save changes first
      onUpdate(editData);
      setIsEditing(false);
      setShowAssignDialog(false);
      
      // Open create meeting modal
      setShowCreateMeetingModal(true);
    } else if (action === 'email') {
      // TODO: Implement email functionality
      alert('Email functionality will be implemented soon');
      onUpdate(editData);
      setIsEditing(false);
      setShowAssignDialog(false);
    } else {
      onUpdate(editData);
      setIsEditing(false);
      setShowAssignDialog(false);
    }
  };
  
  const handleMeetingCreated = (meetingId: number) => {
    setShowCreateMeetingModal(false);
    // Optionally refresh the page or show success message
    console.log('Meeting created with ID:', meetingId);
  };

  const handleCancel = () => {
    setEditData({
      topic: item.topic,
      problem_statement: item.problem_statement ?? '',
      proposed_solution: item.proposed_solution ?? '',
      decisions_actions: item.decisions_actions ?? '',
      status: item.status,
      priority: item.priority,
      responsible_staff_id: item.responsible_staff_id,
      purpose: item.purpose ?? 'Discussion',
      solution_type: item.solution_type ?? null,
      decision_type: item.decision_type ?? null,
      future_implications: item.future_implications ?? false
    });
    setIsEditing(false);
    emitStoppedTyping();
  };

  const emitTyping = () => {
    if (!channel || !currentUserId || !currentUserName) return;
    
    // Use whisper for client events (works with presence channels)
    try {
      const presenceChannel = channel as Record<string, unknown>;
      if (presenceChannel.whisper) {
        presenceChannel.whisper(EVENTS.USER_TYPING, {
          itemId: item.id,
          userId: currentUserId,
          userName: currentUserName
        });
      }
    } catch (error: unknown) {
      console.debug('Whisper not available, typing indicator disabled');
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      emitStoppedTyping();
    }, 3000);
  };

  const emitStoppedTyping = () => {
    if (!channel || !currentUserId) return;
    
    // Use whisper for client events (works with presence channels)
    try {
      const presenceChannel = channel as Record<string, unknown>;
      if (presenceChannel.whisper) {
        presenceChannel.whisper(EVENTS.USER_STOPPED_TYPING, {
          itemId: item.id,
          userId: currentUserId
        });
      }
    } catch (error: unknown) {
      console.debug('Whisper not available, typing indicator disabled');
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (field: string, value: Record<string, unknown>) => {
    setEditData({ ...editData, [field]: value });
    emitTyping();
  };

  const handleAddComment = async (content: string) => {
    if (!meetingId) return;
    
    try {
      const response = await fetch(`/api/meetings/${meetingId}/agenda-items/${item.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      // Refresh the item to show the new comment
      // This should trigger a parent component refresh
      // For now, we'll keep comments section open to show the comment
      setShowComments(true);
      
      // If there's an onUpdate callback, trigger it to refresh data
      if (onUpdate) {
        onUpdate({ topic: item.topic }); // Trigger a refresh
      }
    } catch (error: unknown) {
      console.error('Error adding comment:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-destructive/10 text-destructive';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-muted text-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Ongoing': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-muted text-foreground';
      case 'Assigned_to_local': return 'bg-primary text-primary-foreground';
      case 'Deferred': return 'bg-orange-100 text-orange-700';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className={`bg-card rounded-xl shadow-sm border transition-all hover:shadow-md ${
      item.responsible_staff_id === currentUserId 
        ? 'border-blue-500 shadow-blue-100' 
        : 'border-border'
    }`}>
      <div 
        className="p-5 cursor-pointer" 
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-0.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isExpanded ? 'bg-muted' : 'bg-muted'
              }`}>
                {isExpanded ? 
                  <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-lg border-border focus:border-blue-500"
                />
              ) : (
                <h3 className="font-semibold text-lg text-foreground mb-1">{item.topic}</h3>
              )}
              {item.problem_statement && !isEditing && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.problem_statement}</p>
              )}
              
              {/* Assigned User Pill */}
              {item.ResponsibleStaff && !isEditing && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-xs font-medium">
                    <User className="h-3 w-3" />
                    <span>{item.ResponsibleStaff.User.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Badge className={`${getPriorityColor(item.priority)} border-0 font-medium`}>
              {item.priority}
            </Badge>
            <Badge className={`${getStatusColor(item.status)} border-0 font-medium`}>
              {item.status.replace('_', ' ')}
            </Badge>
            {canEdit && !isEditing && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  // Auto-expand when editing
                  if (!isExpanded) {
                    onToggleExpand();
                  }
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* View Details Link - Only when not expanded */}
        {!isExpanded && !isEditing && meetingId && (
          <div className="mt-2">
            <Link 
              href={`/dashboard/meetings/${meetingId}/agenda/${item.id}`}
              className="text-sm text-primary hover:text-primary font-medium inline-flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              View Details 
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          {/* Problem Statement */}
          {(item.problem_statement ?? isEditing) && (
            <div>
              <label className="text-sm font-medium text-foreground">Problem/Need Statement</label>
              {isEditing ? (
                <Textarea
                  value={editData.problem_statement}
                  onChange={(e) => handleInputChange('problem_statement', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              ) : (
                <p className="mt-1 text-sm">{item.problem_statement}</p>
              )}
            </div>
          )}

          {/* Responsible Staff */}
          <div>
            <label className="text-sm font-medium text-foreground">Responsible Staff</label>
            {isEditing ? (
              <Select
                value={editData.responsible_staff_id?.toString() ?? 'none'}
                onValueChange={(value) => setEditData({ 
                  ...editData, 
                  responsible_staff_id: value === 'none' ? null : parseInt(value) 
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.User.name} ({s.User.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1 flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {item.ResponsibleStaff ? item.ResponsibleStaff.User.name : 'Unassigned'}
                  {item.staff_initials && ` (${item.staff_initials})`}
                </span>
              </div>
            )}
          </div>

          {/* Proposed Solution */}
          {(item.proposed_solution ?? isEditing) && (
            <div>
              <label className="text-sm font-medium text-foreground">Proposed Solution</label>
              {isEditing ? (
                <Textarea
                  value={editData.proposed_solution}
                  onChange={(e) => handleInputChange('proposed_solution', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              ) : (
                <p className="mt-1 text-sm whitespace-pre-wrap">{item.proposed_solution}</p>
              )}
            </div>
          )}

          {/* Decisions & Actions */}
          <div>
            <label className="text-sm font-medium text-foreground">Decision(s) & Action(s)</label>
            {isEditing ? (
              <Textarea
                value={editData.decisions_actions}
                onChange={(e) => handleInputChange('decisions_actions', e.target.value)}
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="mt-1 text-sm whitespace-pre-wrap">{item.decisions_actions || 'No decisions yet'}</p>
            )}
          </div>

          {/* Purpose, Solution Type, Decision Type */}
          {isEditing && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Purpose</label>
                <Select
                  value={editData.purpose}
                  onValueChange={(value: Record<string, unknown>) => setEditData({ ...editData, purpose: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Decision">Decision</SelectItem>
                    <SelectItem value="Information_Sharing">Information</SelectItem>
                    <SelectItem value="Discussion">Discussion</SelectItem>
                    <SelectItem value="Reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">Solution Type</label>
                <Select
                  value={editData.solution_type ?? 'none'}
                  onValueChange={(value) => setEditData({ 
                    ...editData, 
                    solution_type: value === 'none' ? null : value as Record<string, unknown>
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Adaptive">Adaptive</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">Decision Type</label>
                <Select
                  value={editData.decision_type ?? 'none'}
                  onValueChange={(value) => setEditData({ 
                    ...editData, 
                    decision_type: value === 'none' ? null : value as Record<string, unknown>
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Adaptive">Adaptive</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Future Implications Checkbox */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="future-implications"
                checked={editData.future_implications}
                onCheckedChange={(checked) => 
                  setEditData({ ...editData, future_implications: checked as boolean })
                }
              />
              <label 
                htmlFor="future-implications" 
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Decision has Future Implications
              </label>
            </div>
          )}

          {/* Status and Priority */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select
                  value={editData.status}
                  onValueChange={(value: Record<string, unknown>) => setEditData({ ...editData, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assigned_to_local">Assigned to local</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select
                  value={editData.priority}
                  onValueChange={(value: Record<string, unknown>) => setEditData({ ...editData, priority: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Show Purpose and Types when not editing */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Purpose: {item.purpose?.replace('_', ' ')}
              </Badge>
              {item.solution_type && (
                <Badge variant="outline" className="text-xs">
                  Solution: {item.solution_type}
                </Badge>
              )}
              {item.decision_type && (
                <Badge variant="outline" className="text-xs">
                  Decision: {item.decision_type}
                </Badge>
              )}
              {item.future_implications && (
                <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                  Has Future Implications
                </Badge>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <button 
                  className="flex items-center space-x-1 hover:text-foreground transition-colors"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{item.Comments?.length ?? 0} Comments</span>
                </button>
                <div className="flex items-center space-x-1">
                  <Paperclip className="h-4 w-4" />
                  <span>{item.ActionItems?.length ?? 0}</span>
                </div>
                {item.future_implications && !isEditing && (
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Future implications</span>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-4 pt-4 border-t">
                <AgendaItemComments
                  itemId={item.id}
                  comments={item.Comments ?? []}
                  onAddComment={handleAddComment}
                  canComment={canEdit}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Assign to Local Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to Local Team</DialogTitle>
            <DialogDescription>
              This item is being assigned to a local team. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">{item.topic}</p>
              {item.problem_statement && (
                <p className="text-xs text-muted-foreground">{item.problem_statement}</p>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              You can create a new meeting for this agenda item or send an email notification to the responsible team.
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleAssignToLocal('skip')}
              className="w-full sm:w-auto"
            >
              Just Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleAssignToLocal('email')}
              className="w-full sm:w-auto"
            >
              Send Email
            </Button>
            <Button
              onClick={() => handleAssignToLocal('meeting')}
              className="w-full sm:w-auto"
            >
              Create Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Meeting Modal */}
      <CreateMeetingModal
        open={showCreateMeetingModal}
        onOpenChange={setShowCreateMeetingModal}
        agendaItem={{
          id: item.id,
          topic: item.topic,
          problem_statement: item.problem_statement,
          responsible_staff_id: item.responsible_staff_id,
          priority: item.priority,
          purpose: item.purpose
        }}
        onSuccess={handleMeetingCreated}
      />
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AgendaItemComments } from "./AgendaItemComments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Save, 
  X, 
  User, 
  Calendar,
  Clock,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Edit2,
  CheckCircle,
  XCircle,
  FileText,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { getSafeDate, safeFormatDate } from '@/lib/utils/safe-date';

interface Props {
  item: any;
  meeting: any;
  currentUser: any;
  allStaff: any[];
  canEdit: boolean;
}

export function AgendaItemDetail({ item, meeting, currentUser, allStaff, canEdit }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    topic: item.topic,
    problem_statement: item.problem_statement || '',
    proposed_solution: item.proposed_solution || '',
    decisions_actions: item.decisions_actions || '',
    status: item.status,
    priority: item.priority,
    responsible_staff_id: item.responsible_staff_id,
    staff_initials: item.staff_initials || '',
    purpose: item.purpose,
    solution_type: item.solution_type,
    decision_type: item.decision_type,
    future_implications: item.future_implications || false,
    duration_minutes: item.duration_minutes || null
  });

  const [showOngoingDialog, setShowOngoingDialog] = useState(false);
  const [ongoingChoice, setOngoingChoice] = useState<'new_meeting' | 'next_meeting' | null>(null);

  const handleSave = async () => {
    // Check if status changed to Ongoing
    if (editData.status === 'Ongoing' && item.status !== 'Ongoing') {
      setShowOngoingDialog(true);
      return;
    }

    await saveChanges();
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/agenda-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        setIsEditing(false);
        
        // Handle ongoing status actions
        if (editData.status === 'Ongoing' && ongoingChoice) {
          if (ongoingChoice === 'new_meeting') {
            // Create new meeting with this item
            router.push(`/dashboard/meetings/new?fromItem=${item.id}` as any);
          } else if (ongoingChoice === 'next_meeting') {
            // Add to next recurring meeting
            await addToNextMeeting();
          }
        }
        
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
      setShowOngoingDialog(false);
      setOngoingChoice(null);
    }
  };

  const addToNextMeeting = async () => {
    // Find next recurring meeting and add this item
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/next-recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendaItem: editData
        })
      });
      
      if (!response.ok) {
        console.error('Failed to add to next meeting');
      }
    } catch (error) {
      console.error('Error adding to next meeting:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      topic: item.topic,
      problem_statement: item.problem_statement || '',
      proposed_solution: item.proposed_solution || '',
      decisions_actions: item.decisions_actions || '',
      status: item.status,
      priority: item.priority,
      responsible_staff_id: item.responsible_staff_id,
      staff_initials: item.staff_initials || '',
      purpose: item.purpose,
      solution_type: item.solution_type,
      decision_type: item.decision_type,
      future_implications: item.future_implications || false,
      duration_minutes: item.duration_minutes || null
    });
    setIsEditing(false);
  };

  const handleAddComment = async (content: string) => {
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/agenda-items/${item.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/meetings/${meeting.id}/agenda-items/${item.id}/attachments`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Ongoing': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Deferred': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/dashboard/meetings/${meeting.id}/live`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Meeting
              </Link>
              <div className="h-6 w-px bg-muted" />
              <span className="text-sm text-muted-foreground">{meeting.title}</span>
            </div>
            
            {canEdit && !isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
                className="rounded-full"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Item
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Topic Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <h1 className="text-2xl font-bold text-foreground">
                    {isEditing ? (
                      <Input
                        value={editData.topic}
                        onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                        className="text-2xl font-bold"
                      />
                    ) : (
                      item.topic
                    )}
                  </h1>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getPriorityColor(item.priority)} border-0`}>
                    {item.priority} Priority
                  </Badge>
                </div>
              </div>

              {/* Problem Statement */}
              {(item.problem_statement || isEditing) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Problem/Need Statement</h3>
                  {isEditing ? (
                    <Textarea
                      value={editData.problem_statement}
                      onChange={(e) => setEditData({ ...editData, problem_statement: e.target.value })}
                      rows={3}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap">{item.problem_statement}</p>
                  )}
                </div>
              )}

              {/* Proposed Solution */}
              {(item.proposed_solution || isEditing) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Proposed Solution</h3>
                  {isEditing ? (
                    <Textarea
                      value={editData.proposed_solution}
                      onChange={(e) => setEditData({ ...editData, proposed_solution: e.target.value })}
                      rows={3}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap">{item.proposed_solution}</p>
                  )}
                </div>
              )}

              {/* Decisions & Actions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">Decision(s) & Action(s)</h3>
                {isEditing ? (
                  <Textarea
                    value={editData.decisions_actions}
                    onChange={(e) => setEditData({ ...editData, decisions_actions: e.target.value })}
                    rows={4}
                    className="w-full"
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {item.decisions_actions || 'No decisions recorded yet'}
                  </p>
                )}
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <AgendaItemComments
                itemId={item.id}
                comments={item.Comments || []}
                onAddComment={handleAddComment}
                canComment={true}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Details Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Details</h3>
              
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  {isEditing ? (
                    <Select
                      value={editData.status}
                      onValueChange={(value: any) => setEditData({ ...editData, status: value })}
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
                  ) : (
                    <p className="font-medium text-foreground mt-1">
                      {item.status.replace('_', ' ')}
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div>
                  <label className="text-sm text-muted-foreground">Purpose</label>
                  {isEditing ? (
                    <Select
                      value={editData.purpose}
                      onValueChange={(value: any) => setEditData({ ...editData, purpose: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Decision">Decision</SelectItem>
                        <SelectItem value="Discussion">Discussion</SelectItem>
                        <SelectItem value="Information_Sharing">Information Sharing</SelectItem>
                        <SelectItem value="Reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium text-foreground mt-1">
                      {item.purpose.replace('_', ' ')}
                    </p>
                  )}
                </div>

                {/* Type of Solution */}
                {(item.solution_type || isEditing) && (
                  <div>
                    <label className="text-sm text-muted-foreground">Type of Solution</label>
                    {isEditing ? (
                      <Select
                        value={editData.solution_type || ''}
                        onValueChange={(value: any) => setEditData({ ...editData, solution_type: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Adaptive">Adaptive</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium text-foreground mt-1">
                        {item.solution_type || 'Not specified'}
                      </p>
                    )}
                  </div>
                )}

                {/* Type of Decision */}
                {(item.decision_type || isEditing) && (
                  <div>
                    <label className="text-sm text-muted-foreground">Type of Decision</label>
                    {isEditing ? (
                      <Select
                        value={editData.decision_type || ''}
                        onValueChange={(value: any) => setEditData({ ...editData, decision_type: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Adaptive">Adaptive</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium text-foreground mt-1">
                        {item.decision_type || 'Not specified'}
                      </p>
                    )}
                  </div>
                )}

                {/* Responsible Staff */}
                <div>
                  <label className="text-sm text-muted-foreground">Responsible Staff</label>
                  {isEditing ? (
                    <Select
                      value={editData.responsible_staff_id?.toString() || 'none'}
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
                        {allStaff.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.User.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      {item.ResponsibleStaff ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.ResponsibleStaff.User.name}</p>
                            <p className="text-xs text-muted-foreground">{item.ResponsibleStaff.Role.title}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Unassigned</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <div>
                  <label className="text-sm text-muted-foreground">Created</label>
                  <p className="font-medium text-foreground mt-1">
                    {(() => {
                      const date = getSafeDate(item.created_at);
                      return date ? format(date, "MMM d, yyyy") : 'Unknown date';
                    })()}
                  </p>
                </div>

                {/* Future Implications */}
                {item.future_implications && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Has future implications</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center">
                  <Paperclip className="h-5 w-5 mr-2 text-muted-foreground" />
                  Attachments
                </h3>
                {canEdit && (
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    />
                    <label htmlFor="file-upload">
                      <Button size="sm" variant="outline" className="rounded-full" asChild>
                        <span>
                          <Plus className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
              
              {item.Attachments?.length > 0 ? (
                <div className="space-y-2">
                  {item.Attachments.map((attachment: any) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{attachment.file_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No attachments yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ongoing Status Dialog */}
      <Dialog open={showOngoingDialog} onOpenChange={setShowOngoingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Status: Ongoing</DialogTitle>
            <DialogDescription>
              This item will be marked as ongoing. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <button
              onClick={() => setOngoingChoice('new_meeting')}
              className={`w-full p-4 text-left rounded-lg border transition-colors ${
                ongoingChoice === 'new_meeting' 
                  ? 'border-blue-500 bg-primary' 
                  : 'border-border hover:border-border'
              }`}
            >
              <div className="font-medium mb-1">Create a new meeting</div>
              <div className="text-sm text-muted-foreground">
                Start a new meeting to continue working on this item
              </div>
            </button>
            <button
              onClick={() => setOngoingChoice('next_meeting')}
              className={`w-full p-4 text-left rounded-lg border transition-colors ${
                ongoingChoice === 'next_meeting' 
                  ? 'border-blue-500 bg-primary' 
                  : 'border-border hover:border-border'
              }`}
            >
              <div className="font-medium mb-1">Add to next recurring meeting</div>
              <div className="text-sm text-muted-foreground">
                This item will be added to the next scheduled meeting in this series
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOngoingDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveChanges}
              disabled={!ongoingChoice || isSaving}
              className="bg-primary hover:bg-primary"
            >
              {isSaving ? 'Saving...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
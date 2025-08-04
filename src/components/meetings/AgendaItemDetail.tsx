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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/agenda-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        setIsEditing(false);
        // Refresh the page to get updated data
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Ongoing': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Deferred': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/dashboard/meetings/${meeting.id}/live`}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Meeting
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-sm text-gray-600">{meeting.title}</span>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <h1 className="text-2xl font-bold text-gray-900">
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Problem/Need Statement</h3>
                  {isEditing ? (
                    <Textarea
                      value={editData.problem_statement}
                      onChange={(e) => setEditData({ ...editData, problem_statement: e.target.value })}
                      rows={3}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap">{item.problem_statement}</p>
                  )}
                </div>
              )}

              {/* Proposed Solution */}
              {(item.proposed_solution || isEditing) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Proposed Solution</h3>
                  {isEditing ? (
                    <Textarea
                      value={editData.proposed_solution}
                      onChange={(e) => setEditData({ ...editData, proposed_solution: e.target.value })}
                      rows={3}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap">{item.proposed_solution}</p>
                  )}
                </div>
              )}

              {/* Decisions & Actions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Decision(s) & Action(s)</h3>
                {isEditing ? (
                  <Textarea
                    value={editData.decisions_actions}
                    onChange={(e) => setEditData({ ...editData, decisions_actions: e.target.value })}
                    rows={4}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-600 whitespace-pre-wrap">
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  {isEditing ? (
                    <Select
                      value={editData.status}
                      onValueChange={(value: any) => setEditData({ ...editData, status: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Assigned_to_local">Assigned to local</SelectItem>
                        <SelectItem value="Deferred">Deferred</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium text-gray-900 mt-1">
                      {item.status.replace('_', ' ')}
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div>
                  <label className="text-sm text-gray-600">Purpose</label>
                  {isEditing ? (
                    <Select
                      value={editData.purpose}
                      onValueChange={(value: any) => setEditData({ ...editData, purpose: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Information_Sharing">Information Sharing</SelectItem>
                        <SelectItem value="Discussion">Discussion</SelectItem>
                        <SelectItem value="Decision">Decision</SelectItem>
                        <SelectItem value="Reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium text-gray-900 mt-1">
                      {item.purpose.replace('_', ' ')}
                    </p>
                  )}
                </div>

                {/* Responsible Staff */}
                <div>
                  <label className="text-sm text-gray-600">Responsible Staff</label>
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
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.ResponsibleStaff.User.name}</p>
                            <p className="text-xs text-gray-500">{item.ResponsibleStaff.Role.title}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">Unassigned</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <div>
                  <label className="text-sm text-gray-600">Created</label>
                  <p className="font-medium text-gray-900 mt-1">
                    {format(new Date(item.created_at), "MMM d, yyyy")}
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Paperclip className="h-5 w-5 mr-2 text-gray-600" />
                  Attachments
                </h3>
                {canEdit && (
                  <Button size="sm" variant="outline" className="rounded-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {item.Attachments?.length > 0 ? (
                <div className="space-y-2">
                  {item.Attachments.map((attachment: any) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{attachment.file_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No attachments yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
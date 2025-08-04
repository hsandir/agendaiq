"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";

interface ExtendedAgendaItem extends MeetingAgendaItem {
  ResponsibleStaff?: (Staff & { User: PrismaUser }) | null;
  Comments: any[];
  ActionItems: any[];
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
  const [editData, setEditData] = useState({
    topic: item.topic,
    problem_statement: item.problem_statement || '',
    proposed_solution: item.proposed_solution || '',
    decisions_actions: item.decisions_actions || '',
    status: item.status,
    priority: item.priority,
    responsible_staff_id: item.responsible_staff_id
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channel = usePusherChannel(meetingId ? CHANNELS.meeting(meetingId) : null);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
    emitStoppedTyping();
  };

  const handleCancel = () => {
    setEditData({
      topic: item.topic,
      problem_statement: item.problem_statement || '',
      proposed_solution: item.proposed_solution || '',
      decisions_actions: item.decisions_actions || '',
      status: item.status,
      priority: item.priority,
      responsible_staff_id: item.responsible_staff_id
    });
    setIsEditing(false);
    emitStoppedTyping();
  };

  const emitTyping = () => {
    if (!channel || !currentUserId || !currentUserName) return;
    
    channel.trigger(`client-${EVENTS.USER_TYPING}`, {
      itemId: item.id,
      userId: currentUserId,
      userName: currentUserName
    });

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
    
    channel.trigger(`client-${EVENTS.USER_STOPPED_TYPING}`, {
      itemId: item.id,
      userId: currentUserId
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (field: string, value: any) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Ongoing': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-gray-100 text-gray-700';
      case 'Assigned_to_local': return 'bg-blue-100 text-blue-700';
      case 'Deferred': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
      item.responsible_staff_id === currentUserId 
        ? 'border-blue-500 shadow-blue-100' 
        : 'border-gray-200'
    }`}>
      <div 
        className="p-5 cursor-pointer" 
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-0.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isExpanded ? 'bg-gray-100' : 'bg-gray-50'
              }`}>
                {isExpanded ? 
                  <ChevronDown className="h-4 w-4 text-gray-600" /> : 
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                }
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-lg border-gray-300 focus:border-blue-500"
                />
              ) : (
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{item.topic}</h3>
              )}
              {item.problem_statement && !isEditing && (
                <p className="text-sm text-gray-600 line-clamp-2">{item.problem_statement}</p>
              )}
              
              {/* Assigned User Pill */}
              {item.ResponsibleStaff && !isEditing && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
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
              className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              View Details 
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          {/* Problem Statement */}
          {(item.problem_statement || isEditing) && (
            <div>
              <label className="text-sm font-medium text-gray-700">Problem/Need Statement</label>
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
            <label className="text-sm font-medium text-gray-700">Responsible Staff</label>
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
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.User.name} ({s.User.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1 flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {item.ResponsibleStaff ? item.ResponsibleStaff.User.name : 'Unassigned'}
                  {item.staff_initials && ` (${item.staff_initials})`}
                </span>
              </div>
            )}
          </div>

          {/* Proposed Solution */}
          {(item.proposed_solution || isEditing) && (
            <div>
              <label className="text-sm font-medium text-gray-700">Proposed Solution</label>
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
            <label className="text-sm font-medium text-gray-700">Decision(s) & Action(s)</label>
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

          {/* Status and Priority */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
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
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <Select
                  value={editData.priority}
                  onValueChange={(value: any) => setEditData({ ...editData, priority: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Meta Info */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <button 
                  className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{item.Comments?.length || 0} Comments</span>
                </button>
                <div className="flex items-center space-x-1">
                  <Paperclip className="h-4 w-4" />
                  <span>{item.ActionItems?.length || 0}</span>
                </div>
                {item.future_implications && (
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
                  comments={item.Comments || []}
                  onAddComment={handleAddComment}
                  canComment={canEdit}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
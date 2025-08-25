"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { safeFormat } from "@/lib/utils/safe-format";
import {
  Plus,
  Trash2,
  users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Target,
  FileText,
  Flag,
  ChevronRight,
  Users,
  Building
} from "lucide-react";

export interface ActionItem {
  id?: number;
  title: string;
  description: string;
  assignedTo: string;
  assignedToRole?: string;
  department?: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  fromAgendaItem?: number;
  linkedMeetingId?: number;
  linkedMeetingTitle?: string;
  completedDate?: string;
  completedBy?: string;
  notes?: string;
  tags?: string[];
}

interface MeetingActionItemsProps {
  meetingId?: number;
  agendaItems?: Record<string, unknown>[];
  attendees: Record<string, unknown>[];
  actionItems: ActionItem[];
  onChange: (items: ActionItem[]) => void;
  readOnly?: boolean;
  showLinkedMeetings?: boolean;
}

export function MeetingActionItems({
  meetingId,
  agendaItems = [],
  attendees,
  actionItems,
  onChange,
  readOnly = false,
  showLinkedMeetings = true
}: MeetingActionItemsProps) {
  const [newItem, setNewItem] = useState<Partial<ActionItem>>({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
    status: "pending"
  });
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const addActionItem = () => {
    if (!newItem.title || !newItem.assignedTo || !newItem.dueDate) {
      alert("Please fill in all required fields: Title, Assignee, and Due Date");
      return;
    }

    const selectedAttendee = attendees.find(a => a.id === newItem.assignedTo);
    const item: ActionItem = {
      ...newItem as ActionItem,
      assignedTorole: selectedAttendee?.role,
      department: selectedAttendee?.department
    };

    onChange([...actionItems, item]);
    setNewItem({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      priority: "medium",
      status: "pending"
    });
  };

  const updateActionItem = (index: number, updates: Partial<ActionItem>) => {
    const updated = [...actionItems];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeActionItem = (index: number) => {
    onChange(actionItems.filter((_, i) => i !== index));
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-destructive/10 text-destructive";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-muted text-foreground"
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />
    }
  };

  const filteredItems = actionItems.filter(item => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (filterAssignee !== "all" && item.assignedTo !== filterAssignee) return false;
    if (filterPriority !== "all" && item.priority !== filterPriority) return false;
    return true;
  });

  const groupedByAssignee = filteredItems.reduce((acc, item, index) => {
    const key = item.assignedTo;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...item, originalIndex: index });
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Action Items Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filter by Assignee</Label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {attendees.map(attendee => (
                    <SelectItem key={attendee.id} value={attendee.id}>
                      {attendee.name} ({attendee.role});
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filter by Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{actionItems.length}</div>
              <div className="text-sm text-muted-foreground">Total Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {actionItems.filter(i => i.status === "pending").length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {actionItems.filter(i => i.status === "in_progress").length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {actionItems.filter(i => i.status === "completed").length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Action Item */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Action Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={newItem.title ?? ""}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Enter action item title"
                />
              </div>
              <div>
                <Label>Assign To *</Label>
                <Select
                  value={newItem.assignedTo ?? ""}
                  onValueChange={(value) => setNewItem({ ...newItem, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {attendees.map(attendee => (
                      <SelectItem key={attendee.id} value={attendee.id}>
                        {attendee.name} - {attendee.role} ({attendee.department});
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newItem.description ?? ""}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Enter detailed description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={newItem.dueDate ?? ""}
                  onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={newItem.priority ?? "medium"}
                  onValueChange={(value: Record<string, unknown>) => setNewItem({ ...newItem, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Link to Agenda Item</Label>
                <Select
                  value={newItem.fromAgendaItem?.toString() ?? ""}
                  onValueChange={(value) => setNewItem({ ...newItem, fromAgendaItem: parseInt(value) || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {agendaItems.map((item, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        #{index + 1}: {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={addActionItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Action Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Items List */}
      <div className="space-y-4">
        {Object.entries(groupedByAssignee).map(([assigneeId, items]) => {
          const assignee = attendees.find(a => a.id === assigneeId);
          return (
            <Card key={assigneeId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{assignee?.name ?? "Unknown"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assignee?.role} • {assignee?.department} • {items.length} action items
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {items.filter(i => i.status === "completed").length}/{items.length} completed
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.originalIndex}
                      className={`border rounded-lg p-4 transition-all ${
                        item.status === "completed" ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(item.status)}
                            <h4 className={`font-medium ${
                              item.status === "completed" ? "line-through text-muted-foreground" : ""
                            }`}>
                              {item.title}
                            </h4>
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            {item.fromAgendaItem !== undefined && (
                              <Badge variant="outline">
                                Agenda #{item.fromAgendaItem + 1}
                              </Badge>
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {safeFormat(item.dueDate, "MMM dd, yyyy")}
                            </div>
                            {item.status === "completed" && item.completedDate && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed: {safeFormat(item.completedDate, "MMM dd, yyyy")}
                              </div>
                            )}
                          </div>

                          {expandedItems.has(item.originalIndex) && (
                            <div className="mt-3 space-y-2 pt-3 border-t">
                              {!readOnly && (
                                <>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">Status</Label>
                                      <Select
                                        value={item.status}
                                        onValueChange={(value: Record<string, unknown>) => 
                                          updateActionItem(item.originalIndex, { 
                                            status: value,
                                            completedDate: value === "completed" ? new Date().toISOString() : undefined
                                          })
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="in_progress">In Progress</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Priority</Label>
                                      <Select
                                        value={item.priority}
                                        onValueChange={(value: Record<string, unknown>) => 
                                          updateActionItem(item.originalIndex, { priority: value });
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="low">Low</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="high">High</SelectItem>
                                          <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Notes</Label>
                                    <Textarea
                                      value={item.notes ?? ""}
                                      onChange={(e) => 
                                        updateActionItem(item.originalIndex, { notes: e.target.value });
                                      }
                                      placeholder="Add notes..."
                                      rows={2}
                                      className="text-sm"
                                    />
                                  </div>
                                </>
                              )}
                              
                              {showLinkedMeetings && item.linkedMeetingId && (
                                <div className="p-2 bg-primary rounded text-sm">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="text-primary">
                                      From meeting: {item.linkedMeetingTitle}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleExpanded(item.originalIndex)}
                          >
                            <ChevronRight className={`h-4 w-4 transition-transform ${
                              expandedItems.has(item.originalIndex) ? "rotate-90" : ""
                            }`} />
                          </Button>
                          {!readOnly && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeActionItem(item.originalIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No action items found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
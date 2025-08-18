"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiSelectV2 as MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select-v2";
import { safeFormatDateTime, safeFormatDate, safeFormatTime } from '@/lib/utils/safe-date';
import { Calendar, Clock, Users, Video, ArrowLeft, Save, X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { format } from "date-fns";

interface AgendaItem {
  id: string;
  topic: string;
  description: string;
  purpose: string;
  priority: string;
  duration_minutes: number;
  responsible_staff_id: string | null;
  status: string;
  order_index: number;
}

interface MeetingEditFormProps {
  meeting: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    agenda: string;
    notes: string;
    status: string;
    type?: string;
    location?: string;
    zoomLink?: string;
    zoomMeetingId?: string;
    calendarIntegration?: string;
    attendees: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
    }>;
    agendaItems?: AgendaItem[];
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  }>;
  meetingId: number;
  isStep2: boolean;
}

export function MeetingEditForm({ meeting, users, meetingId, isStep2 }: MeetingEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Basic Info
  const [title, setTitle] = useState(meeting.title);
  const [description, setDescription] = useState(meeting.description);
  const [meetingType, setMeetingType] = useState(meeting.type || 'regular');
  const [location, setLocation] = useState(meeting.location || '');
  
  // Date and Time
  const [startDate, setStartDate] = useState(() => {
    if (meeting.startTime) {
      const date = new Date(meeting.startTime);
      return format(date, 'yyyy-MM-dd');
    }
    return '';
  });
  const [startTime, setStartTime] = useState(() => {
    if (meeting.startTime) {
      const date = new Date(meeting.startTime);
      return format(date, 'HH:mm');
    }
    return '';
  });
  const [endDate, setEndDate] = useState(() => {
    if (meeting.endTime) {
      const date = new Date(meeting.endTime);
      return format(date, 'yyyy-MM-dd');
    }
    return '';
  });
  const [endTime, setEndTime] = useState(() => {
    if (meeting.endTime) {
      const date = new Date(meeting.endTime);
      return format(date, 'HH:mm');
    }
    return '';
  });
  
  // Content
  const [agenda, setAgenda] = useState(meeting.agenda);
  const [notes, setNotes] = useState(meeting.notes);
  
  // Agenda Items
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(meeting.agendaItems || []);
  
  // Agenda Item functions
  const addAgendaItem = () => {
    const newItem: AgendaItem = {
      id: `new-${Date.now()}`,
      topic: '',
      description: '',
      purpose: 'Discussion',
      priority: 'Medium',
      duration_minutes: 15,
      responsible_staff_id: null,
      status: 'Pending',
      order_index: agendaItems.length
    };
    setAgendaItems([...agendaItems, newItem]);
  };
  
  const removeAgendaItem = (id: string) => {
    setAgendaItems(agendaItems.filter(item => item.id !== id));
  };
  
  const updateAgendaItem = (id: string, field: keyof AgendaItem, value: unknown) => {
    setAgendaItems(agendaItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  const moveAgendaItem = (id: string, direction: 'up' | 'down') => {
    const index = agendaItems.findIndex(item => item.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === agendaItems.length - 1)) {
      return;
    }
    
    const newItems = [...agendaItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    // Update order indices
    newItems.forEach((item, idx) => {
      item.order_index = idx;
    });
    
    setAgendaItems(newItems);
  };
  
  // Integrations
  const [zoomMeetingId, setZoomMeetingId] = useState(meeting.zoomMeetingId || '');
  const [zoomLink, setZoomLink] = useState(meeting.zoomLink || '');
  const [calendarIntegration, setCalendarIntegration] = useState(meeting.calendarIntegration || 'none');
  
  // Attendees - ensure we have valid string array
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>(() => {
    const attendeeIds = meeting.attendees?.map(a => a.id).filter(id => id) || [];
    return attendeeIds;
  });

  // Convert users to MultiSelect options
  const attendeeOptions: MultiSelectOption[] = users.map(user => ({
    value: user.id,
    label: user.name,
    email: user.email,
    role: (user as Record<string, unknown>.role,
    department: (user as Record<string, unknown>).department
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      const response = (await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          meeting_type: meetingType,
          location,
          zoom_meeting_id: zoomMeetingId || null,
          zoom_link: zoomLink || null,
          calendar_integration: calendarIntegration !== 'none' ? calendarIntegration : null,
          agenda,
          notes,
          status: isStep2 ? 'scheduled' : meeting.status,
          attendeeIds: selectedAttendees,
          agendaItems: agendaItems.map((item, index) => ({
            id: item.id.startsWith('new-') ? undefined : parseInt(item.id),
            topic: item.topic,
            description: item.description,
            purpose: item.purpose,
            priority: item.priority,
            duration_minutes: item.duration_minutes,
            responsible_staff_id: item.responsible_staff_id ? parseInt(item.responsible_staff_id) : null,
            status: item.status,
            order_index: index
          }))
        }),
      }));

      if (response.ok) {
        router.push(`/dashboard/meetings/${meetingId}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update meeting');
      }
    } catch (error: unknown) {
      console.error('Error updating meeting:', error);
      alert(error instanceof Error ? error.message : 'Error updating meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/dashboard/meetings')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Meetings
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/meetings/${meetingId}`)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Updating...' : 'Update Meeting'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter meeting description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Meeting Type</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Meeting</SelectItem>
                  <SelectItem value="standup">Stand-up</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="retrospective">Retrospective</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Meeting room or address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date and Time */}
      <Card>
        <CardHeader>
          <CardTitle>Date and Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time *</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label>End Date & Time *</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendees */}
      <Card>
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Select Attendees</Label>
            <MultiSelect
              options={attendeeOptions}
              selected={selectedAttendees || []}
              onChange={(value) => setSelectedAttendees(value || [])}
              placeholder="Search and select attendees..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              {(selectedAttendees || []).length} attendee{(selectedAttendees || []).length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Current Attendees List */}
          {meeting.attendees.length > 0 && (
            <div className="mt-4">
              <Label>Current Attendees</Label>
              <div className="mt-2 space-y-2">
                {meeting.attendees.map(attendee => (
                  <div key={attendee.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">{attendee.name}</p>
                      <p className="text-xs text-muted-foreground">{attendee.email}</p>
                    </div>
                    <Badge variant={attendee.status === 'accepted' ? 'default' : 'secondary'}>
                      {attendee.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Agenda Items</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {agendaItems.length} items • Total duration: {agendaItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0)} minutes
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => router.push(`/dashboard/meetings/${meetingId}/agenda`)}
                variant="default"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-1" />
                Full Editor
              </Button>
              <Button
                type="button"
                onClick={addAgendaItem}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Quick Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {agendaItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No agenda items yet. Click "Add Item" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {agendaItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveAgendaItem(item.id, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveAgendaItem(item.id, 'down')}
                          disabled={index === agendaItems.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAgendaItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Topic *</Label>
                      <Input
                        value={item.topic}
                        onChange={(e) => updateAgendaItem(item.id, 'topic', e.target.value)}
                        placeholder="Agenda item topic"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Priority</Label>
                      <Select 
                        value={item.priority} 
                        onValueChange={(value) => updateAgendaItem(item.id, 'priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Purpose</Label>
                      <Select 
                        value={item.purpose} 
                        onValueChange={(value) => updateAgendaItem(item.id, 'purpose', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Discussion">Discussion</SelectItem>
                          <SelectItem value="Decision">Decision</SelectItem>
                          <SelectItem value="Information">Information</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={item.duration_minutes}
                        onChange={(e) => updateAgendaItem(item.id, 'duration_minutes', parseInt(e.target.value) || 15)}
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <Label>Status</Label>
                      <Select 
                        value={item.status} 
                        onValueChange={(value) => updateAgendaItem(item.id, 'status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                          <SelectItem value="Deferred">Deferred</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateAgendaItem(item.id, 'description', e.target.value)}
                      placeholder="Additional details about this agenda item..."
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label>Responsible Person</Label>
                    <Select 
                      value={item.responsible_staff_id || ''} 
                      onValueChange={(value) => updateAgendaItem(item.id, 'responsible_staff_id', value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select responsible person" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({(user as Record<string, unknown>.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="agenda">Meeting Summary</Label>
            <Textarea
              id="agenda"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Overall meeting summary..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meeting notes, decisions, follow-ups..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zoomId">Zoom Meeting ID</Label>
              <Input
                id="zoomId"
                value={zoomMeetingId}
                onChange={(e) => setZoomMeetingId(e.target.value)}
                placeholder="Enter Zoom meeting ID"
              />
            </div>

            <div>
              <Label htmlFor="zoomLink">Zoom Link</Label>
              <Input
                id="zoomLink"
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="calendar">Calendar Integration</Label>
            <Select value={calendarIntegration} onValueChange={setCalendarIntegration}>
              <SelectTrigger>
                <SelectValue placeholder="Select calendar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="google">Google Calendar</SelectItem>
                <SelectItem value="outlook">Outlook Calendar</SelectItem>
                <SelectItem value="apple">Apple Calendar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Status (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={meeting.status === 'scheduled' ? 'default' : 'secondary'}>
              {meeting.status}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Created on {safeFormatDate(meeting.startTime)}
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
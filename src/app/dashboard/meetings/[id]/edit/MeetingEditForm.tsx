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
import { Calendar, Clock, Users, Video, ArrowLeft, Save, X } from "lucide-react";
import { format } from "date-fns";

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
    description: `${user.role} - ${user.department}`
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      const response = await fetch(`/api/meetings/${meetingId}`, {
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
          attendeeIds: selectedAttendees
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/meetings/${meetingId}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update meeting');
      }
    } catch (error) {
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
              value={selectedAttendees || []}
              onChange={(value) => setSelectedAttendees(value || [])}
              placeholder="Search and select attendees..."
              emptyMessage="No attendees found"
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

      {/* Meeting Content */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Meeting agenda items..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meeting notes..."
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
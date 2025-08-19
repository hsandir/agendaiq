"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { MultiSelectV2 as MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select-v2";
import dynamic from 'next/dynamic';
import type { RepeatConfig } from "@/components/meetings/RepeatMeetingModal";

// Lazy load heavy modals for better performance
const RepeatMeetingModal = dynamic(
  () => import('@/components/meetings/RepeatMeetingModal').then(mod => mod.RepeatMeetingModal),
  {
    loading: () => <div className="text-sm text-muted-foreground">Loading...</div>,
    ssr: false
  }
);

const MeetingHistoryModal = dynamic(
  () => import('@/components/meetings/MeetingHistoryModal').then(mod => mod.MeetingHistoryModal),
  {
    loading: () => <div className="text-sm text-muted-foreground">Loading...</div>,
    ssr: false
  }
);
import { Search, Users, Calendar, Video, Repeat, Link, CalendarDays, FolderOpen } from "lucide-react";
import { addMinutes, format } from "date-fns";
import { safeFormatDate, isValidDate, getSafeDate } from '@/lib/utils/safe-date';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Role {
  id: number;
  title: string;
  category?: string;
}

interface MeetingFormStep1Props {
  users: User[];
  departments: Department[];
  roles: Role[];
  onSubmit: (data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    repeatType: string;
    repeatEndDate: string;
    repeatConfig?: Record<string, unknown>;
    calendarIntegration: string;
    meetingType: string;
    zoomMeetingId: string;
    attendeeIds: string[];
    isContinuation: boolean;
    parentMeetingId?: number;
  }) => Promise<any>;
}

export function MeetingFormStep1({ users, departments, roles, onSubmit }: MeetingFormStep1Props) {
  console.log("MeetingFormStep1 - users received:", users?.length ?? 0, "users");
  
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const [calendarIntegration, setCalendarIntegration] = useState("none");
  const [meetingType, setMeetingType] = useState("regular");
  const [zoomMeetingId, setZoomMeetingId] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [isContinuation, setIsContinuation] = useState(false);
  const [parentMeetingId, setParentMeetingId] = useState<number | undefined>();
  const [showContinuationSearch, setShowContinuationSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatConfig, setRepeatConfig] = useState<RepeatConfig | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPreviousMeeting, setSelectedPreviousMeeting] = useState<any>(null);

  // Transform users to MultiSelectOptions
  const attendeeOptions: MultiSelectOption[] = users.map(user => ({
    value: user.id,
    label: user.name,
    email: user.email,
    department: 'department' in user ? user.department : null,
    role: 'role' in user ? user.role : null
  }));
  
  console.log("Attendee options created:", attendeeOptions.length, "options");
  
  useEffect(() => {
    console.log("Component mounted/updated - users:", users?.length ?? 0);
    console.log("First few users:", users?.slice(0, 3));
  }, [users]);

  // Get unique departments and roles for filters
  const uniqueDepartments = (Array.from(new Set(users.map(u => u.department))));
  const uniqueRoles = (Array.from(new Set(users.map(u => u.role))));

  // Auto-set end time when start time changes
  const handleStartTimeChange = (newStartTime: string) => {
    console.log("Start time changed to:", newStartTime);
    
    // Validate the new start time
    if (!newStartTime) {
      setStartTime("");
      return;
    }
    
    try {
      const startDate = getSafeDate(newStartTime);
      if (!startDate) {
        console.error("Invalid start time:", newStartTime);
        return;
      }
      
      setStartTime(newStartTime);
      
      // Auto-set end time to 1 hour after start time if not set
      if (!endTime) {
        const endDate = addMinutes(startDate, 60);
        const formattedEndTime = endDate.toISOString().slice(0, 16);
        setEndTime(formattedEndTime);
        console.log("Auto-set end time to:", formattedEndTime);
      }
    } catch (error: unknown) {
      console.error("Error handling start time change:", error);
    }
  };

  const handleSearchMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.meetings ?? []);
    } catch (error: unknown) {
      console.error("Error searching meetings:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreviousMeeting = (meeting: Record<string, unknown>) => {
    setSelectedPreviousMeeting(meeting);
    setParentMeetingId(meeting.id);
    setTitle(`${meeting.title} (Continuation)`);
    setDescription(meeting.description ?? "");
    setMeetingType(meeting.meeting_type ?? "regular");
    
    // Set attendees if available
    if (meeting.attendees && Array.isArray(meeting.attendees)) {
      const attendeeIds = (meeting.attendees.map((a: Record<string, unknown>) => a.id ?? a.staff_id).filter(Boolean));
      setSelectedAttendees(attendeeIds);
    }
    
    // Auto-set continuation flag
    setIsContinuation(true);
  };

  const handleSelectMultipleMeetings = (meetings: Record<string, unknown>[], options: { importAgendaItems: boolean; importAttendees: boolean }) => {
    // Use the first meeting as the base
    const baseMeeting = meetings[0];
    setSelectedPreviousMeeting(baseMeeting);
    setParentMeetingId(baseMeeting.id);
    
    // Create title from all selected meetings
    const titles = (meetings.map(m => m.title).join(', '));
    setTitle(`Continuation of: ${titles}`);
    
    // Combine descriptions
    const descriptions = (meetings.map(m => m.description).filter(Boolean));
    if (descriptions.length > 0) {
      setDescription(`Combined from previous meetings:\n${descriptions.join('\n\n')}`);
    }
    
    // Import attendees if requested
    if (options.importAttendees) {
      const allAttendees = new Set<string>();
      meetings.forEach(meeting => {
        if (meeting.attendees && Array.isArray(meeting.attendees)) {
          meeting.attendees.forEach((a: Record<string, unknown>) => {
            const id = a.id ?? a.staff_id;
            if (id) allAttendees.add(id);
          });
        }
      });
      setSelectedAttendees(Array.from(allAttendees));
    }
    
    // Store the parent meeting ID (use the first selected meeting as parent)
    if (meetings.length > 0) {
      setParentMeetingId(meetings[0].id);
    }
    
    setIsContinuation(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title || !startTime || !endTime || selectedAttendees.length === 0) {
      alert("Please fill in all required fields and select at least one attendee.");
      return;
    }

    // Validate date values
    try {
      const startDate = getSafeDate(startTime);
      const endDate = getSafeDate(endTime);
      
      if (!startDate) {
        alert("Invalid start date/time. Please select a valid date and time.");
        return;
      }
      
      if (!endDate) {
        alert("Invalid end date/time. Please select a valid date and time.");
        return;
      }
      
      if (endDate <= startDate) {
        alert("End time must be after start time.");
        return;
      }
    } catch (error: unknown) {
      alert("Invalid date/time values. Please check your selections.");
      return;
    }

    if (repeatType !== "none" && !repeatEndDate) {
      alert("Please select an end date for the repeat series.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        title,
        description,
        startTime,
        endTime,
        repeatType,
        repeatEndDate,
        repeatConfig,
        calendarIntegration,
        meetingType,
        zoomMeetingId,
        attendeeIds: selectedAttendees,
        isContinuation,
        parentMeetingId,
      });
      
      if (result?.success && result?.meetingId) {
        // Client-side redirect to Step 2 (agenda items)
        router.push(`/dashboard/meetings/${result.meetingId}/agenda`);
      } else if (result?.message) {
        alert(result.message);
      }
    } catch (error: unknown) {
      console.error("Error creating meeting:", error);
      alert("Error creating meeting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Meeting Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Basic Meeting Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="meetingType">Meeting Type *</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Meeting</SelectItem>
                  <SelectItem value="emergency">Emergency Meeting</SelectItem>
                  <SelectItem value="review">Review Meeting</SelectItem>
                  <SelectItem value="planning">Planning Meeting</SelectItem>
                  <SelectItem value="training">Training Session</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimePicker
              id="startTime"
              label="Start Date & Time"
              value={startTime}
              onChange={handleStartTimeChange}
              required
            />
            <DateTimePicker
              id="endTime"
              label="End Date & Time"
              value={endTime}
              onChange={setEndTime}
              minDate={startTime ? new Date(startTime) : undefined}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Meeting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Meeting Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Repeat Settings</Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={repeatConfig ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setShowRepeatModal(true)}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {repeatConfig ? (
                    <span>
                      Repeats {repeatConfig.pattern} 
                      {repeatConfig.endType === 'after' && ` (${repeatConfig.occurrences} times)`}
                      {repeatConfig.endType === 'by' && ` until ${format(new Date(repeatConfig.endDate!), 'MMM dd, yyyy')}`}
                    </span>
                  ) : (
                    "Configure Repeat Settings"
                  )}
                </Button>
                {repeatConfig && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRepeatConfig(null)}
                  >
                    Clear repeat settings
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="calendarIntegration">Calendar Integration</Label>
              <Select value={calendarIntegration} onValueChange={setCalendarIntegration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Integration</SelectItem>
                  <SelectItem value="google">Google Calendar</SelectItem>
                  <SelectItem value="apple">Apple Calendar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zoomMeetingId">Zoom Meeting ID</Label>
              <Input
                id="zoomMeetingId"
                value={zoomMeetingId}
                onChange={(e) => setZoomMeetingId(e.target.value)}
                placeholder="Enter Zoom meeting ID"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continuation Meeting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Continuation Meeting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isContinuation"
              checked={isContinuation}
              onCheckedChange={setIsContinuation}
            />
            <Label htmlFor="isContinuation">This is a continuation of a previous meeting</Label>
          </div>

          {isContinuation && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  onClick={() => setShowHistoryModal(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Select from Previous Meetings
                </Button>
              </div>
              
              {selectedPreviousMeeting && (
                <div className="p-4 bg-primary border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-primary">Continuing from:</p>
                      <p className="text-sm text-primary mt-1">{selectedPreviousMeeting.title}</p>
                      <p className="text-xs text-primary mt-1">
                        {safeFormatDate(selectedPreviousMeeting.start_time)} • 
                        {selectedPreviousMeeting.attendees} attendees • 
                        {selectedPreviousMeeting.agendaItems} agenda items
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPreviousMeeting(null);
                        setParentMeetingId(undefined);
                        setTitle("");
                        setDescription("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Or search manually:
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by date, meeting ID, title, attendee, or department"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleSearchMeetings}
                  disabled={isLoading}
                  variant="secondary"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Search Results:</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {searchResults.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                        onClick={() => setParentMeetingId(meeting.id)}
                      >
                        <div className="font-medium">{meeting.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {safeFormatDate(meeting.start_time)} - {meeting.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Attendees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MultiSelect
            options={attendeeOptions}
            selected={selectedAttendees}
            onChange={setSelectedAttendees}
            placeholder="Click to select attendees..."
            label="Meeting Attendees"
            required
            showSearch
            showDepartmentFilter
            showRoleFilter
            departments={uniqueDepartments}
            roles={uniqueRoles}
            maxHeight="400px"
          />
          {selectedAttendees.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              {selectedAttendees.length} attendee(s) selected
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" className="px-8" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Continue to Step 2"}
        </Button>
      </div>

      {/* Repeat Meeting Modal */}
      <RepeatMeetingModal
        isOpen={showRepeatModal}
        onClose={() => setShowRepeatModal(false)}
        startDate={startTime}
        endDate={endTime}
        onConfirm={(config) => {
          setRepeatConfig(config);
          setRepeatType(config.pattern);
          if (config.endType === 'by' && config.endDate) {
            setRepeatEndDate(config.endDate);
          }
        }}
      />
      
      {/* Meeting History Modal */}
      <MeetingHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectMeeting={handleSelectPreviousMeeting}
        multiSelect={isContinuation}
        onSelectMultipleMeetings={handleSelectMultipleMeetings}
      />
    </form>
  );
} 
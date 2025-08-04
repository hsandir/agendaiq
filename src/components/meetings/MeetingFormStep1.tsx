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
import { Search, Users, Calendar, Video, Repeat, Link } from "lucide-react";

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
    calendarIntegration: string;
    meetingType: string;
    zoomMeetingId: string;
    attendeeIds: string[];
    isContinuation: boolean;
    parentMeetingId?: number;
  }) => Promise<any>;
}

export function MeetingFormStep1({ users, departments, roles, onSubmit }: MeetingFormStep1Props) {
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

  // Filter states
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");

  const filteredUsers = users.filter(user => {
    const matchesDepartment = !departmentFilter || departmentFilter === "all" || user.department === departmentFilter;
    const matchesRole = !roleFilter || roleFilter === "all" || user.role === roleFilter;
    const matchesSearch = !searchFilter || 
      user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      user.email.toLowerCase().includes(searchFilter.toLowerCase());
    
    return matchesDepartment && matchesRole && matchesSearch;
  });

  const handleAttendeeToggle = (userId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSearchMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.meetings || []);
    } catch (error) {
      console.error("Error searching meetings:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !startTime || !endTime || selectedAttendees.length === 0) {
      alert("Please fill in all required fields and select at least one attendee.");
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
    } catch (error) {
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
            <div>
              <Label htmlFor="startTime">Start Date & Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Date & Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="repeatType">Repeat Type</Label>
              <Select value={repeatType} onValueChange={setRepeatType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {repeatType !== "none" && (
              <div>
                <Label htmlFor="repeatEndDate">Repeat Until</Label>
                <Input
                  id="repeatEndDate"
                  type="date"
                  value={repeatEndDate}
                  onChange={(e) => setRepeatEndDate(e.target.value)}
                  min={startTime.split('T')[0]}
                  required={repeatType !== "none"}
                />
              </div>
            )}
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
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => setParentMeetingId(meeting.id)}
                      >
                        <div className="font-medium">{meeting.title}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(meeting.start_time).toLocaleDateString()} - {meeting.description}
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
            Select Attendees *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="departmentFilter">Filter by Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="roleFilter">Filter by Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.title}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="searchFilter">Search by Name/Email</Label>
              <Input
                id="searchFilter"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search attendees..."
              />
            </div>
          </div>

          {/* Attendee List */}
          <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAttendees.includes(user.id)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  onClick={() => handleAttendeeToggle(user.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{user.department}</Badge>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                  <div className="ml-4">
                    {selectedAttendees.includes(user.id) && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedAttendees.length > 0 && (
            <div className="text-sm text-gray-600">
              Selected: {selectedAttendees.length} attendee(s)
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
    </form>
  );
} 
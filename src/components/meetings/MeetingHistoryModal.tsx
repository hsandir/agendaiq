"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { safeFormat } from "@/lib/utils/safe-format";
import {
  Search,
  Calendar,
  Users,
  Building,
  Clock,
  FileText,
  ChevronRight,
  Filter,
  FolderOpen,
  users,
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Meeting {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_type: string;
  organizer: {
    name: string;
    role: string;
    department: string;
  };
  attendees: number;
  agendaItems: number;
  actionItems?: number;
  completedActions?: number;
  department?: string;
  isRecurring?: boolean;
  parentMeetingId?: number;
}

interface ImportOptions {
  importAgendaItems: boolean;
  importAttendees: boolean;
}

interface MeetingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectmeeting: (meeting: Meeting) => void;
  currentUserId?: string;
  currentDepartment?: string;
  currentRole?: string;
  multiSelect?: boolean;
  onSelectMultipleMeetings?: (meetings: Meeting[], options: ImportOptions) => void;
}

export function MeetingHistoryModal({
  isOpen,
  onClose,
  onSelectmeeting,
  currentUserId,
  currentdepartment,
  currentrole,
  multiSelect = false,
  onSelectMultipleMeetings
}: MeetingHistoryModalProps) {
  const [activeTab, setActiveTab] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [includeSubDepartments, setIncludeSubDepartments] = useState(true);
  const [onlyWithActionItems, setOnlyWithActionItems] = useState(false);
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<Set<number>>(new Set());
  const [importAgendaItems, setImportAgendaItems] = useState(true);
  const [importAttendees, setImportAttendees] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchMeetings();
    }
  }, [isOpen, activeTab, selectedDepartment, selectedTimeRange, selectedStatus]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tab: activeTab,
        department: selectedDepartment,
        timeRange: selectedTimeRange,
        status: selectedStatus,
        search: searchQuery,
        includeSubDepartments: includeSubDepartments.toString(),
        onlyWithActionItems: onlyWithActionItems.toString()
      });

      const response = await fetch(`/api/meetings/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings ?? []);
      }
    } catch (error: unknown) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const getMeetingStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case "department":
        return "bg-primary text-primary-foreground";
      case "project":
        return "bg-secondary text-secondary";
      case "one_on_one":
        return "bg-green-100 text-green-800";
      case "all_hands":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-muted text-foreground";
    }
  };

  const handleSelectMeeting = (meeting: Meeting) => {
    if (multiSelect) {
      const newSelected = new Set(selectedMeetingIds);
      if (newSelected.has(meeting.id)) {
        newSelected.delete(meeting.id);
      } else {
        newSelected.add(meeting.id);
      }
      setSelectedMeetingIds(newSelected);
    } else {
      setSelectedMeeting(meeting);
    }
  };

  const confirmSelection = () => {
    if (multiSelect && onSelectMultipleMeetings) {
      const selected = meetings.filter(m => selectedMeetingIds.has(m.id));
      if (selected.length > 0) {
        onSelectMultipleMeetings(selected, {
          importAgendaItems,
          importAttendees
        });
        onClose();
      }
    } else if (selectedMeeting) {
      onSelectMeeting(selectedMeeting);
      onClose();
    }
  };

  const filterMeetings = () => {
    return meetings.filter(meeting => {
      if (searchQuery && !meeting.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (onlyWithActionItems && (!meeting.actionItems ?? meeting.actionItems === 0)) {
        return false;
      }
      return true;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Previous Meeting
          </DialogTitle>
          <DialogDescription>
            Choose a meeting to continue from or use as a template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchMeetings}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="my_meetings">My Meetings</TabsTrigger>
              <TabsTrigger value="department">Department</TabsTrigger>
              <TabsTrigger value="attended">Attended</TabsTrigger>
              <TabsTrigger value="with_actions">With Actions</TabsTrigger>
            </TabsList>

            {/* Filter Options */}
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Time Range</Label>
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="subdepts"
                    checked={includeSubDepartments}
                    onCheckedChange={(checked) => setIncludeSubDepartments(checked as boolean)}
                  />
                  <Label htmlFor="subdepts" className="text-sm font-normal">
                    Include sub-departments
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="withactions"
                    checked={onlyWithActionItems}
                    onCheckedChange={(checked) => setOnlyWithActionItems(checked as boolean)}
                  />
                  <Label htmlFor="withactions" className="text-sm font-normal">
                    Only meetings with action items
                  </Label>
                </div>
              </div>
            </div>

            {/* Meeting List */}
            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading meetings...</div>
                ) : filterMeetings().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No meetings found</div>
                ) : (
                  <div className="space-y-3">
                    {filterMeetings().map((meeting) => (
                      <Card
                        key={meeting.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          multiSelect 
                            ? selectedMeetingIds.has(meeting.id) ? "ring-2 ring-blue-500" : ""
                            : selectedMeeting?.id === meeting.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => handleSelectMeeting(meeting)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {multiSelect && (
                                  <Checkbox 
                                    checked={selectedMeetingIds.has(meeting.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    onCheckedChange={() => handleSelectMeeting(meeting)}
                                  />
                                )}
                                {getMeetingStatusIcon(meeting.status)}
                                {meeting.title}
                                {meeting.isRecurring && (
                                  <Badge variant="outline" className="text-xs">
                                    Recurring
                                  </Badge>
                                )}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {meeting.description || "No description"}
                              </p>
                            </div>
                            <Badge className={getMeetingTypeColor(meeting.meeting_type)}>
                              {meeting.meeting_type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{safeFormat(meeting.start_time, "MMM dd, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{safeFormat(meeting.start_time, "HH:mm")} - {safeFormat(meeting.end_time, "HH:mm")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{meeting.organizer.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{meeting.attendees} attendees</span>
                            </div>
                          </div>

                          <div className="flex gap-4 mt-3 pt-3 border-t">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{meeting.agendaItems} agenda items</span>
                            </div>
                            {meeting.actionItems !== undefined && (
                              <div className="flex items-center gap-1">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {meeting.completedActions ?? 0}/{meeting.actionItems} actions completed
                                </span>
                              </div>
                            )}
                            {meeting.department && (
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{meeting.department}</span>
                              </div>
                            )}
                          </div>

                          {selectedMeeting?.id === meeting.id && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-primary">
                                  Selected for continuation
                                </span>
                                <ChevronRight className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedMeeting ? (
              <span>Selected: <strong>{selectedMeeting.title}</strong></span>
            ) : (
              <span>No meeting selected</span>
            )}
          </div>
          {multiSelect && selectedMeetingIds.size > 0 && (
            <div className="flex items-center gap-3 mr-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={importAgendaItems}
                  onCheckedChange={(checked) => setImportAgendaItems(checked as boolean)}
                />
                Import Agenda Items
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={importAttendees}
                  onCheckedChange={(checked) => setImportAttendees(checked as boolean)}
                />
                Import Attendees
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={confirmSelection} 
              disabled={multiSelect ? selectedMeetingIds.size === 0 : !selectedMeeting}
            >
              {multiSelect 
                ? `Use ${selectedMeetingIds.size} Meeting${selectedMeetingIds.size > 1 ? 's' : ''}`
                : 'Use This Meeting'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
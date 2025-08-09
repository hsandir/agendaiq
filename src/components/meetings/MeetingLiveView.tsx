"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Paperclip,
  User,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Eye,
  ArrowLeft,
  Grid,
  List,
  FileText
} from "lucide-react";
import { AgendaItemLive } from "./AgendaItemLive";
import { usePusherChannel, usePresenceChannel } from "@/hooks/usePusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";
import Link from "next/link";
import { safeFormatDate, safeFormatTime, getSafeDate } from '@/lib/utils/safe-date';
import type { 
  Meeting, 
  MeetingAgendaItem, 
  MeetingAttendee, 
  Staff, 
  User as PrismaUser,
  Department,
  Role
} from "@prisma/client";

interface ExtendedMeeting extends Meeting {
  Department: Department;
  Staff: Staff & { User: PrismaUser; Role: Role };
  MeetingAttendee: (MeetingAttendee & { 
    Staff: Staff & { 
      User: PrismaUser; 
      Role: Role; 
      Department: Department 
    } 
  })[];
  MeetingAgendaItems: (MeetingAgendaItem & {
    ResponsibleStaff?: (Staff & { User: PrismaUser }) | null;
    Comments: any[];
    ActionItems: any[];
  })[];
  MeetingActionItems: any[];
}

interface ExtendedStaff extends Staff {
  User: PrismaUser;
  Role: Role;
  Department: Department;
}

interface Props {
  meeting: ExtendedMeeting;
  currentUser: any;
  allStaff: ExtendedStaff[];
  isOrganizer: boolean;
  isAdmin: boolean;
}

export function MeetingLiveView({ 
  meeting, 
  currentUser, 
  allStaff,
  isOrganizer,
  isAdmin
}: Props) {
  const [agendaItems, setAgendaItems] = useState(meeting.MeetingAgendaItems);
  const [activeTab, setActiveTab] = useState("agenda");
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<number, { userId: number; userName: string }>>(new Map());
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Set hydrated flag after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Set up real-time updates with Pusher
  const eventHandlers = useMemo(() => ({
    [EVENTS.AGENDA_ITEM_UPDATED]: (data: any) => {
      setAgendaItems(prev => prev.map(item => 
        item.id === data.itemId ? { ...item, ...data.updates } : item
      ));
      setLastUpdate(new Date());
    },
    [EVENTS.AGENDA_ITEM_ADDED]: (data: any) => {
      setAgendaItems(prev => [...prev, data.item]);
      setLastUpdate(new Date());
    },
    [EVENTS.AGENDA_ITEM_DELETED]: (data: any) => {
      setAgendaItems(prev => prev.filter(item => item.id !== data.itemId));
      setLastUpdate(new Date());
    },
    [EVENTS.USER_TYPING]: (data: any) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.itemId, { userId: data.userId, userName: data.userName });
        return newMap;
      });
    },
    [EVENTS.USER_STOPPED_TYPING]: (data: any) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.itemId);
        return newMap;
      });
    },
    'comment-added': (data: any) => {
      setAgendaItems(prev => prev.map(item => 
        item.id === data.itemId 
          ? { ...item, Comments: [...(item.Comments || []), data.comment] }
          : item
      ));
    },
    'pusher:subscription_succeeded': () => {
      setIsConnected(true);
    },
    'pusher:subscription_error': () => {
      setIsConnected(false);
    }
  }), []);

  const channel = usePusherChannel(
    CHANNELS.meeting(meeting.id),
    eventHandlers
  );

  // Set up presence channel for live user tracking
  const { members } = usePresenceChannel(
    CHANNELS.presence(meeting.id),
    useMemo(() => ({}), [])
  );

  const refreshMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${meeting.id}`);
      const data = await response.json();
      
      if (data.success && data.meeting) {
        setAgendaItems(data.meeting.MeetingAgendaItems);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error refreshing meeting:", error);
    }
  };

  const handleItemUpdate = async (itemId: number, updates: any) => {
    // Optimistic update
    setAgendaItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));

    try {
      const response = await fetch(`/api/meetings/${meeting.id}/agenda-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        // Revert on error
        await refreshMeeting();
      }
    } catch (error) {
      console.error("Error updating agenda item:", error);
      await refreshMeeting();
    }
  };

  const addNewAgendaItem = async () => {
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/agenda-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            topic: 'New Agenda Item',
            priority: 'Medium',
            purpose: 'Discussion',
            status: 'Pending',
            order_index: agendaItems.length
          }]
        })
      });

      if (response.ok) {
        await refreshMeeting();
      }
    } catch (error) {
      console.error("Error adding agenda item:", error);
    }
  };

  const toggleItemExpanded = (itemId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Meeting status
  const getMeetingStatus = () => {
    const now = new Date();
    const start = getSafeDate(meeting.start_time);
    const end = getSafeDate(meeting.end_time);

    if (!start || !end) return { status: "unknown", label: "Unknown", color: "bg-muted text-foreground" };
    if (now < start) return { status: "upcoming", label: "Upcoming", color: "bg-primary text-primary-foreground" };
    if (now > end) return { status: "completed", label: "Completed", color: "bg-muted text-foreground" };
    return { status: "in-progress", label: "In Progress", color: "bg-green-100 text-green-700" };
  };

  const meetingStatus = getMeetingStatus();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header with Gradient */}
      <div className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Back Link */}
            <Link 
              href="/dashboard/meetings" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Meetings
            </Link>
            
            {/* Meeting Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">{meeting.title}</h1>
                  <Badge className={`${meetingStatus.color} px-3 py-1`}>
                    {meetingStatus.label}
                  </Badge>
                </div>
                {meeting.description && (
                  <p className="text-muted-foreground mt-2 text-lg">{meeting.description}</p>
                )}
                
                {/* Meeting Info Pills */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{safeFormatDate(meeting.start_time, undefined, 'No date')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {safeFormatTime(meeting.start_time, { hour: '2-digit', minute: '2-digit' }, 'No time')} - 
                      {safeFormatTime(meeting.end_time, { hour: '2-digit', minute: '2-digit' }, 'No time')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{meeting.MeetingAttendee.length} attendees</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Host: {meeting.Staff.User.name}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3 ml-6">
                {/* Connection Status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  isConnected 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {isConnected ? (
                    <><Wifi className="h-4 w-4" /><span>Live</span></>
                  ) : (
                    <><WifiOff className="h-4 w-4" /><span>Offline</span></>
                  )}
                </div>
                
                <Button
                  onClick={refreshMeeting}
                  variant="outline"
                  className="rounded-full"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3">
            {/* Agenda Header with View Toggle */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Agenda Items</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {agendaItems.length} items • 
                    {agendaItems.filter(i => i.status === 'Resolved').length} completed
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-card text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <List className="h-4 w-4 inline mr-1" />
                      List
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-card text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Grid className="h-4 w-4 inline mr-1" />
                      Grid
                    </button>
                  </div>
                  
                  {(isOrganizer || isAdmin) && (
                    <Button 
                      onClick={addNewAgendaItem} 
                      className="rounded-full bg-primary hover:bg-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Agenda Items */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
              {agendaItems.length === 0 ? (
                <div className="bg-card rounded-xl p-12 text-center col-span-full">
                  <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No agenda items yet</h3>
                    <p className="text-muted-foreground mb-4">Get started by adding your first agenda item</p>
                    {(isOrganizer || isAdmin) && (
                      <Button onClick={addNewAgendaItem} className="rounded-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                agendaItems.map((item) => {
                  const typingUser = typingUsers.get(item.id);
                  return (
                    <div key={item.id} className="relative">
                      <AgendaItemLive
                        item={item}
                        staff={allStaff}
                        isExpanded={expandedItems.has(item.id)}
                        onToggleExpand={() => toggleItemExpanded(item.id)}
                        onUpdate={(updates) => handleItemUpdate(item.id, updates)}
                        canEdit={isOrganizer || isAdmin || item.responsible_staff_id === currentUser.staff?.id}
                        currentUserId={currentUser.id}
                        currentUserName={currentUser.name}
                        meetingId={meeting.id}
                      />
                      {typingUser && typingUser.userId !== currentUser.id && (
                        <div className="absolute -bottom-2 left-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full shadow-sm">
                          {typingUser.userName} is typing...
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Attendees Card */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                Attendees
              </h3>
              <div className="space-y-3">
                {meeting.MeetingAttendee.map((attendee) => (
                  <div key={attendee.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-foreground text-sm font-medium">
                        {attendee.Staff.User.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{attendee.Staff.User.name}</p>
                        <p className="text-xs text-muted-foreground">{attendee.Staff.Role.title}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={attendee.status === 'attended' ? 'default' : 'outline'} 
                      className={`text-xs ${
                        attendee.status === 'attended' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {attendee.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Users */}
            {members.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                  Live Now ({members.length})
                </h3>
                <div className="space-y-2">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      </div>
                      <div>
                        <span className="text-foreground">{member.info.name}</span>
                        <span className="text-muted-foreground text-xs ml-1">• {member.info.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Stats */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Progress Overview</h3>
              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium text-foreground">
                      {agendaItems.length > 0 
                        ? Math.round((agendaItems.filter(i => i.status === 'Resolved').length / agendaItems.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: agendaItems.length > 0 
                          ? `${(agendaItems.filter(i => i.status === 'Resolved').length / agendaItems.length) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">Total Items</span>
                    <span className="font-semibold text-foreground">{agendaItems.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      Resolved
                    </span>
                    <span className="font-semibold text-green-600">
                      {agendaItems.filter(i => i.status === 'Resolved').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                      Ongoing
                    </span>
                    <span className="font-semibold text-yellow-600">
                      {agendaItems.filter(i => i.status === 'Ongoing').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <div className="w-2 h-2 bg-muted rounded-full mr-2" />
                      Pending
                    </span>
                    <span className="font-semibold text-muted-foreground">
                      {agendaItems.filter(i => i.status === 'Pending').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Update */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <div className="text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="font-semibold text-foreground">
                  {isHydrated ? (lastUpdate ? lastUpdate.toLocaleTimeString() : 'Not yet') : '...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
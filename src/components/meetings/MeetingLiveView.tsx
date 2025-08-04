"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Eye
} from "lucide-react";
import { AgendaItemLive } from "./AgendaItemLive";
import { usePusherChannel, usePresenceChannel } from "@/hooks/usePusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";
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
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<number, { userId: number; userName: string }>>(new Map());

  // Set up real-time updates with Pusher
  const eventHandlers = {
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
    'pusher:subscription_succeeded': () => {
      setIsConnected(true);
    },
    'pusher:subscription_error': () => {
      setIsConnected(false);
    }
  };

  const channel = usePusherChannel(
    CHANNELS.meeting(meeting.id),
    eventHandlers
  );

  // Set up presence channel for live user tracking
  const { members } = usePresenceChannel(
    CHANNELS.presence(meeting.id),
    {}
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
    const start = new Date(meeting.start_time!);
    const end = new Date(meeting.end_time!);

    if (now < start) return { status: "upcoming", label: "Upcoming", color: "bg-blue-100 text-blue-700" };
    if (now > end) return { status: "completed", label: "Completed", color: "bg-gray-100 text-gray-700" };
    return { status: "in-progress", label: "In Progress", color: "bg-green-100 text-green-700" };
  };

  const meetingStatus = getMeetingStatus();

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{meeting.title}</CardTitle>
              <p className="text-gray-600 mt-1">{meeting.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={meetingStatus.color}>
                {meetingStatus.label}
              </Badge>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMeeting}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{new Date(meeting.start_time!).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>
                {new Date(meeting.start_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(meeting.end_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{meeting.MeetingAttendee.length} attendees</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span>Organizer: {meeting.Staff.User.name}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agenda Items - Main Column */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agenda Items</CardTitle>
                {(isOrganizer || isAdmin) && (
                  <Button onClick={addNewAgendaItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agendaItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No agenda items yet. Add one to get started.
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
                          <div className="absolute -bottom-2 left-4 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                            {typingUser.userName} is typing...
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {meeting.MeetingAttendee.map((attendee) => (
                  <div key={attendee.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{attendee.Staff.User.name}</p>
                      <p className="text-xs text-gray-600">{attendee.Staff.Role.title}</p>
                    </div>
                    <Badge variant={attendee.status === 'attended' ? 'default' : 'outline'} className="text-xs">
                      {attendee.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Users */}
          {members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Now ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>{member.info.name}</span>
                      <span className="text-gray-500 text-xs">({member.info.role})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Items</span>
                  <span className="font-medium">{agendaItems.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Resolved</span>
                  <span className="font-medium text-green-600">
                    {agendaItems.filter(i => i.status === 'Resolved').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ongoing</span>
                  <span className="font-medium text-yellow-600">
                    {agendaItems.filter(i => i.status === 'Ongoing').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-medium text-gray-600">
                    {agendaItems.filter(i => i.status === 'Pending').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Update */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Last updated</p>
                <p className="font-medium">{lastUpdate.toLocaleTimeString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
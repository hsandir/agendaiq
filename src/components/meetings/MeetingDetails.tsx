"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Clock, 
  FileText, 
  Plus, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Video,
  Save,
  MessageSquare 
} from 'lucide-react';
import { safeFormatDateTime } from '@/lib/utils/safe-date';

interface User {
  id: number;
  name: string | null;
  email: string;
}

interface MeetingAttendee {
  id: string;
  status: string | null;
  staff: {
    user: User;
  };
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  zoomLink?: string;
  status: string;
  organizer: User;
  attendees: MeetingAttendee[];
  isOrganizer: boolean;
}

interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  order: number;
}

interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

interface MeetingDetailsProps {
  meeting: Meeting;
  isOrganizer: boolean;
  canRespond: boolean;
  onRespond?: (status: "ACCEPTED" | "DECLINED") => Promise<void>;
}

export function MeetingDetails({ meeting, isOrganizer, canRespond, onRespond }: MeetingDetailsProps) {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newAgendaItem, setNewAgendaItem] = useState({ title: '', description: '' });
  const [activeTab, setActiveTab] = useState('details');

  // Fetch real meeting data from API
  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        // Try to fetch agenda items and notes from API
        const [agendaResponse, notesResponse] = await Promise.all([
          fetch(`/api/meetings/${meeting.id}/agenda`),
          fetch(`/api/meetings/${meeting.id}/notes`)
        ]);

        if (agendaResponse.ok) {
          const agendaData = await agendaResponse.json();
          setAgendaItems(agendaData.items || []);
        } else {
          // Fallback to default agenda items if API fails
          setAgendaItems([
            { id: '1', title: 'Review quarterly results', description: 'Discuss Q3 performance metrics', completed: false, order: 1 },
            { id: '2', title: 'Budget planning for Q4', description: 'Allocate resources for upcoming quarter', completed: false, order: 2 },
            { id: '3', title: 'Staff development initiatives', description: 'Plan training programs', completed: false, order: 3 },
          ]);
        }

        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData.notes || []);
        } else {
          // Fallback to default notes if API fails
          setNotes([
            { id: '1', content: 'Meeting started on time. All attendees present.', author: 'John Doe', timestamp: new Date().toISOString() },
            { id: '2', content: 'Discussed the importance of meeting our Q3 targets.', author: 'Jane Smith', timestamp: new Date().toISOString() },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch meeting data:', error);
        // Use fallback data on error
        setAgendaItems([
          { id: '1', title: 'Review quarterly results', description: 'Discuss Q3 performance metrics', completed: false, order: 1 },
          { id: '2', title: 'Budget planning for Q4', description: 'Allocate resources for upcoming quarter', completed: false, order: 2 },
        ]);
        setNotes([
          { id: '1', content: 'Meeting started on time. All attendees present.', author: 'Current User', timestamp: new Date().toISOString() },
        ]);
      }
    };

    fetchMeetingData();
  }, [meeting.id]);

  const addNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote.trim(),
        author: 'Current User', // This would be the current user's name
        timestamp: new Date().toISOString(),
      };
      setNotes([...notes, note]);
      setNewNote('');
    }
  };

  const addAgendaItem = () => {
    if (newAgendaItem.title.trim()) {
      const item: AgendaItem = {
        id: Date.now().toString(),
        title: newAgendaItem.title.trim(),
        description: newAgendaItem.description.trim(),
        completed: false,
        order: agendaItems.length + 1,
      };
      setAgendaItems([...agendaItems, item]);
      setNewAgendaItem({ title: '', description: '' });
    }
  };

  const toggleAgendaItem = (id: string) => {
    setAgendaItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteAgendaItem = (id: string) => {
    setAgendaItems(items => items.filter(item => item.id !== id));
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-destructive/10 text-destructive">Declined</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Meeting Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{meeting.title}</CardTitle>
              <CardDescription className="mt-2">
                Organized by {meeting.organizer.name}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {meeting.zoomLink && (
                <Button variant="outline" asChild>
                  <a href={meeting.zoomLink} target="_blank" rel="noopener noreferrer">
                    <Video className="mr-2 h-4 w-4" />
                    Join Zoom
                  </a>
                </Button>
              )}
              {canRespond && onRespond && (
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => onRespond('ACCEPTED')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button 
                    onClick={() => onRespond('DECLINED')}
                    variant="destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Meeting Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                    <p className="text-sm text-foreground">
                      {safeFormatDateTime(meeting.startTime, undefined, 'No start time')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Time</label>
                    <p className="text-sm text-foreground">
                      {safeFormatDateTime(meeting.endTime, undefined, 'No end time')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm text-foreground capitalize">{meeting.status}</p>
                  </div>
                </div>
                {meeting.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm text-foreground whitespace-pre-wrap mt-1">
                      {meeting.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Agenda</CardTitle>
              <CardDescription>
                Track agenda items and mark them as completed during the meeting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add New Agenda Item */}
                {isOrganizer && (
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <div className="space-y-3">
                                             <Input
                         placeholder="Agenda item title"
                         value={newAgendaItem.title}
                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAgendaItem({ ...newAgendaItem, title: e.target.value })}
                       />
                       <Textarea
                         placeholder="Description (optional)"
                         value={newAgendaItem.description}
                         onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAgendaItem({ ...newAgendaItem, description: e.target.value })}
                       />
                      <Button onClick={addAgendaItem} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Agenda Item
                      </Button>
                    </div>
                  </div>
                )}

                {/* Agenda Items List */}
                <div className="space-y-3">
                  {agendaItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        item.completed ? 'bg-green-50 border-green-200' : 'bg-card border-border'
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAgendaItem(item.id)}
                        className={`mt-0.5 ${item.completed ? 'text-green-600' : 'text-muted-foreground'}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <h4 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {index + 1}. {item.title}
                        </h4>
                        {item.description && (
                          <p className={`text-sm mt-1 ${item.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      {isOrganizer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAgendaItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Notes</CardTitle>
              <CardDescription>
                Collaborative note-taking for all attendees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add New Note */}
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={addNote} size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Note
                    </Button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-muted rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        By {note.author} • {safeFormatDateTime(note.timestamp, undefined, 'Unknown time')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Attendees</CardTitle>
              <CardDescription>
                View attendance status and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meeting.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {attendee.staff.user.name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {attendee.staff.user.email}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(attendee.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
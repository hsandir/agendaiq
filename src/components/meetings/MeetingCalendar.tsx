"use client";

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, List, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { safeFormatDateTime } from '@/lib/utils/safe-date';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  zoomLink?: string;
  status: string;
}

interface MeetingCalendarProps {
  meetings: Meeting[];
  onRefresh: () => void;
}

export default function MeetingCalendar({ meetings, onRefresh }: MeetingCalendarProps) {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [calendarRef, setCalendarRef] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Ensure we're on the client side before rendering FullCalendar
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Transform meetings for FullCalendar
  const events = meetings.map(meeting => ({
    id: meeting.id,
    title: meeting.title,
    start: meeting.startTime,
    end: meeting.endTime,
    backgroundColor: meeting.status === 'scheduled' ? '#3b82f6' : 
                    meeting.status === 'in_progress' ? '#10b981' : 
                    meeting.status === 'completed' ? '#6b7280' : '#ef4444',
    borderColor: meeting.status === 'scheduled' ? '#3b82f6' : 
                meeting.status === 'in_progress' ? '#10b981' : 
                meeting.status === 'completed' ? '#6b7280' : '#ef4444',
    extendedProps: {
      description: meeting.description,
      zoomLink: meeting.zoomLink,
      status: meeting.status
    }
  }));

  const handleEventClick = (info: any) => {
    router.push(`/dashboard/meetings/${info.event.id}`);
  };

  const handleDateSelect = (selectInfo: any) => {
    const startDate = selectInfo.start.toISOString();
    router.push(`/dashboard/meetings/new?date=${encodeURIComponent(startDate)}`);
  };

  const handleViewChange = (newView: string) => {
    setCalendarView(newView);
    if (calendarRef) {
      calendarRef.getApi().changeView(newView);
    }
  };

  const renderListView = () => (
    <div className="space-y-4">
      {meetings.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new meeting.</p>
          <div className="mt-6">
            <Button onClick={() => router.push('/dashboard/meetings/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
          </div>
        </div>
      ) : (
        meetings.map((meeting) => (
          <Card 
            key={meeting.id} 
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle 
                  className="text-lg cursor-pointer hover:text-blue-600"
                  onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
                >
                  {meeting.title}
                </CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  meeting.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                  meeting.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {meeting.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <strong>Start:</strong> {safeFormatDateTime(meeting.startTime, undefined, 'No start time')}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>End:</strong> {safeFormatDateTime(meeting.endTime, undefined, 'No end time')}
                </div>
                {meeting.description && (
                  <div className="text-sm text-gray-600">
                    <strong>Description:</strong> {meeting.description}
                  </div>
                )}
                {meeting.zoomLink && (
                  <div className="text-sm text-blue-600">
                    <strong>Zoom Link:</strong> Available
                  </div>
                )}
                <div className="pt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => router.push(`/dashboard/meetings/${meeting.id}/live`)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Join Live
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderCalendarView = () => {
    if (!isClient) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Calendar className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading Calendar...</h3>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-6">
          <FullCalendar
            ref={setCalendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={calendarView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            events={events}
            eventClick={handleEventClick}
            selectable={true}
            select={handleDateSelect}
            height="auto"
            dayMaxEvents={3}
            moreLinkClick="popover"
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Button>
        </div>
        <Button onClick={() => router.push('/dashboard/meetings/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Meeting
        </Button>
      </div>

      {/* Calendar View Controls */}
      {view === 'calendar' && (
        <div className="flex space-x-2 mb-4">
          <Button
            variant={calendarView === 'dayGridMonth' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('dayGridMonth')}
          >
            Month
          </Button>
          <Button
            variant={calendarView === 'timeGridWeek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('timeGridWeek')}
          >
            Week
          </Button>
          <Button
            variant={calendarView === 'timeGridDay' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('timeGridDay')}
          >
            Day
          </Button>
          <Button
            variant={calendarView === 'listWeek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('listWeek')}
          >
            Agenda
          </Button>
        </div>
      )}

      {/* Content */}
      {view === 'calendar' ? renderCalendarView() : renderListView()}
    </div>
  );
} 
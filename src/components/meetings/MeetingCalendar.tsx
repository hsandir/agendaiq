"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, List, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { safeFormatDateTime, safeFormatDate, safeFormatTime } from '@/lib/utils/safe-date';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth, isToday } from 'date-fns';

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days for calendar grid
  const startPadding = getDay(monthStart);
  const paddingDays = Array(startPadding).fill(null);

  const getMeetingsForDay = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return isSameDay(meetingDate, date);
    });
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (viewMode === 'list') {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Meeting List</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {meetings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No meetings scheduled</p>
            ) : (
              meetings.map(meeting => (
                <div key={meeting.id} className="border rounded-lg p-3 hover:bg-muted">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {safeFormatDateTime(meeting.startTime)} - {safeFormatTime(meeting.endTime)}
                      </p>
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground mt-1">{meeting.description}</p>
                      )}
                    </div>
                    <Badge variant={meeting.status === 'completed' ? 'secondary' : 'default'}>
                      {meeting.status}
                    </Badge>
                  </div>
                  {meeting.zoomLink && (
                    <a 
                      href={meeting.zoomLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline mt-2 inline-block"
                    >
                      Join Meeting
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0 border-t border-l">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="border-r border-b p-2 text-center text-sm font-medium bg-muted">
              {day}
            </div>
          ))}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="border-r border-b p-2 min-h-[80px] bg-muted" />
          ))}
          {days.map(day => {
            const dayMeetings = getMeetingsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b p-2 min-h-[80px] cursor-pointer hover:bg-muted ${
                  !isCurrentMonth ? 'bg-muted text-muted-foreground' : ''
                } ${isTodayDate ? 'bg-primary' : ''} ${
                  selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="font-medium text-sm mb-1">
                  {format(day, 'd')}
                </div>
                {dayMeetings.slice(0, 2).map(meeting => (
                  <div
                    key={meeting.id}
                    className="text-xs bg-primary text-primary rounded px-1 py-0.5 mb-1 truncate"
                    title={meeting.title}
                  >
                    {safeFormatTime(meeting.startTime)} {meeting.title}
                  </div>
                ))}
                {dayMeetings.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayMeetings.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {selectedDate && (
          <div className="mt-4 p-3 bg-muted rounded">
            <h3 className="font-medium mb-2">
              Meetings on {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <div className="space-y-2">
              {getMeetingsForDay(selectedDate).length === 0 ? (
                <p className="text-sm text-muted-foreground">No meetings scheduled</p>
              ) : (
                getMeetingsForDay(selectedDate).map(meeting => (
                  <div key={meeting.id} className="bg-card p-2 rounded border">
                    <div className="font-medium text-sm">{meeting.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {safeFormatTime(meeting.startTime)} - {safeFormatTime(meeting.endTime)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
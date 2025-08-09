"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendaItem: {
    id: number;
    topic: string;
    problem_statement?: string | null;
    responsible_staff_id?: number | null;
    priority?: string;
    purpose?: string;
  };
  onSuccess?: (meetingId: number) => void;
}

export function CreateMeetingModal({ 
  open, 
  onOpenChange, 
  agendaItem,
  onSuccess 
}: CreateMeetingModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: `Follow-up: ${agendaItem.topic}`,
    description: agendaItem.problem_statement || '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    zoomLink: '',
    attendees: [] as number[]
  });

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Combine date and time
      const startDateTime = new Date(formData.date);
      const [startHour, startMinute] = formData.startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));
      
      const endDateTime = new Date(formData.date);
      const [endHour, endMinute] = formData.endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
      
      // Create meeting
      const meetingResponse = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          zoomLink: formData.zoomLink || undefined,
          attendeeIds: formData.attendees
        })
      });
      
      if (!meetingResponse.ok) {
        throw new Error('Failed to create meeting');
      }
      
      const { data: meeting } = await meetingResponse.json();
      
      // Add the agenda item to the new meeting
      const agendaResponse = await fetch(`/api/meetings/${meeting.id}/agenda-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            topic: agendaItem.topic,
            problem_statement: agendaItem.problem_statement,
            responsible_staff_id: agendaItem.responsible_staff_id,
            priority: agendaItem.priority || 'Medium',
            purpose: agendaItem.purpose || 'Discussion',
            status: 'Pending',
            order_index: 0,
            parent_item_id: agendaItem.id // Link to original item
          }]
        })
      });
      
      if (!agendaResponse.ok) {
        console.error('Failed to add agenda item to new meeting');
      }
      
      // Success callback
      if (onSuccess) {
        onSuccess(meeting.id);
      }
      
      // Close modal and navigate
      onOpenChange(false);
      router.push(`/dashboard/meetings/${meeting.id}/edit`);
      
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Follow-up Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting for the agenda item: "{agendaItem.topic}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter meeting title"
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Meeting description"
              rows={3}
            />
          </div>
          
          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData({ ...formData, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          {/* Zoom Link (optional) */}
          <div className="space-y-2">
            <Label htmlFor="zoomLink">Zoom Link (Optional)</Label>
            <Input
              id="zoomLink"
              type="url"
              value={formData.zoomLink}
              onChange={(e) => setFormData({ ...formData, zoomLink: e.target.value })}
              placeholder="https://zoom.us/j/..."
            />
          </div>
          
          {/* Original Agenda Item Info */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Original Agenda Item</p>
            <p className="text-sm font-medium">{agendaItem.topic}</p>
            {agendaItem.problem_statement && (
              <p className="text-xs text-muted-foreground mt-1">{agendaItem.problem_statement}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
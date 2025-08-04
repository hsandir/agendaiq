"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, ArrowLeft, ArrowRight, Calendar, Users, Clock } from "lucide-react";
import { AgendaItemForm, AgendaItemFormData } from "./AgendaItemForm";
import type { Priority, Purpose, AgendaItemStatus } from "@prisma/client";

interface MeetingData {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  meeting_type: string;
  MeetingAttendee: Array<{
    Staff: {
      id: number;
      User: {
        name: string | null;
        email: string;
      }
    }
  }>;
}

interface Props {
  meetingId: number;
  onComplete?: () => void;
}

export function MeetingFormStep2({ meetingId, onComplete }: Props) {
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItemFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch meeting data
  useEffect(() => {
    async function fetchMeeting() {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`);
        const data = await response.json();
        
        if (data.meeting) {
          setMeeting(data.meeting);
          
          // If meeting already has agenda items, load them
          if (data.meeting.MeetingAgendaItems?.length > 0) {
            setAgendaItems(data.meeting.MeetingAgendaItems.map((item: any) => ({
              topic: item.topic,
              problem_statement: item.problem_statement,
              staff_initials: item.staff_initials,
              responsible_staff_id: item.responsible_staff_id,
              priority: item.priority,
              purpose: item.purpose,
              proposed_solution: item.proposed_solution,
              solution_type: item.solution_type,
              decisions_actions: item.decisions_actions,
              decision_type: item.decision_type,
              status: item.status,
              future_implications: item.future_implications,
              duration_minutes: item.duration_minutes,
              order_index: item.order_index
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching meeting:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMeeting();
  }, [meetingId]);

  // Add new agenda item
  const addAgendaItem = () => {
    const newItem: AgendaItemFormData = {
      topic: '',
      priority: 'Medium' as Priority,
      purpose: 'Discussion' as Purpose,
      status: 'Pending' as AgendaItemStatus,
      order_index: agendaItems.length
    };
    setAgendaItems([...agendaItems, newItem]);
  };

  // Update agenda item
  const updateAgendaItem = (index: number, item: AgendaItemFormData) => {
    const updated = [...agendaItems];
    updated[index] = item;
    setAgendaItems(updated);
  };

  // Remove agenda item
  const removeAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  // Move agenda item up
  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const items = [...agendaItems];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    // Update order indices
    items.forEach((item, i) => {
      item.order_index = i;
    });
    setAgendaItems(items);
  };

  // Move agenda item down
  const moveItemDown = (index: number) => {
    if (index === agendaItems.length - 1) return;
    const items = [...agendaItems];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    // Update order indices
    items.forEach((item, i) => {
      item.order_index = i;
    });
    setAgendaItems(items);
  };

  // Save agenda items
  const handleSave = async () => {
    if (agendaItems.length === 0) {
      alert("Please add at least one agenda item.");
      return;
    }

    // Validate all agenda items have topics
    const invalidItems = agendaItems.filter(item => !item.topic.trim());
    if (invalidItems.length > 0) {
      alert("All agenda items must have a topic.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/meetings/${meetingId}/agenda-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: agendaItems }),
      });

      if (!response.ok) {
        throw new Error('Failed to save agenda items');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update meeting status to scheduled
        await fetch(`/api/meetings/${meetingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'scheduled' }),
        });

        if (onComplete) {
          onComplete();
        } else {
          router.push(`/dashboard/meetings/${meetingId}`);
        }
      }
    } catch (error) {
      console.error("Error saving agenda items:", error);
      alert("Failed to save agenda items. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!meeting) {
    return <div className="text-center py-8">Meeting not found</div>;
  }

  // Extract staff list from attendees
  const staff = meeting.MeetingAttendee.map(ma => ({
    id: ma.Staff.id,
    name: ma.Staff.User.name || ma.Staff.User.email,
    initials: ma.Staff.User.name?.split(' ').map(n => n[0]).join('').toUpperCase() || ''
  }));

  return (
    <div className="space-y-6">
      {/* Meeting Info Header */}
      <Card>
        <CardHeader>
          <CardTitle>{meeting.title}</CardTitle>
          <CardDescription>
            Add agenda items for this meeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{new Date(meeting.start_time).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>
                {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{meeting.MeetingAttendee.length} attendees</span>
            </div>
            <Badge variant="outline">{meeting.meeting_type}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Agenda Items */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Agenda Items</h3>
          <Button onClick={addAgendaItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Agenda Item
          </Button>
        </div>

        {agendaItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">No agenda items added yet.</p>
              <Button onClick={addAgendaItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Agenda Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agendaItems.map((item, index) => (
              <AgendaItemForm
                key={index}
                item={item}
                index={index}
                staff={staff}
                onUpdate={updateAgendaItem}
                onRemove={removeAgendaItem}
                onMoveUp={moveItemUp}
                onMoveDown={moveItemDown}
                isFirst={index === 0}
                isLast={index === agendaItems.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/meetings/${meetingId}/edit`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Step 1
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/meetings')}
          >
            Save as Draft
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Complete & Schedule Meeting
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
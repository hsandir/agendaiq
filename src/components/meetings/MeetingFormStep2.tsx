"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, ArrowLeft, ArrowRight, Calendar, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronUp, ChevronDown, GripVertical, Target } from "lucide-react";
import { safeFormatDate, safeFormatTime } from '@/lib/utils/safe-date';
import { MeetingActionItems, type ActionItem } from "./MeetingActionItems";

interface Attendee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface AgendaItem {
  id?: number;
  title: string;
  description: string;
  duration: number;
  presenter_id?: number;
  order: number;
}

interface Props {
  meetingId: number;
  meetingTitle: string;
  meetingDate: string;
  attendees: Attendee[];
  existingItems?: AgendaItem[];
  onSubmit: (items: AgendaItem[]) => Promise<{ success: boolean; message?: string }>;
  onFinalize: () => Promise<{ success: boolean; redirect?: string; message?: string }>;
}

export function MeetingFormStep2({ 
  meetingId, 
  meetingTitle, 
  meetingDate, 
  attendees, 
  existingItems = [],
  onSubmit,
  onFinalize 
}: Props) {
  const router = useRouter();
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(
    existingItems.length > 0 ? existingItems : [{
      title: '',
      description: '',
      duration: 15,
      order: 0
    }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [activeTab, setActiveTab] = useState<"agenda" | "actions">("agenda");


  // Add new agenda item
  const addAgendaItem = () => {
    const newItem: AgendaItem = {
      title: '',
      description: '',
      duration: 15,
      order: agendaItems.length
    };
    setAgendaItems([...agendaItems, newItem]);
  };

  // Update agenda item
  const updateAgendaItem = (index: number, updates: Partial<AgendaItem>) => {
    const updated = [...agendaItems];
    updated[index] = { ...updated[index], ...updates };
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
      item.order = i;
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
      item.order = i;
    });
    setAgendaItems(items);
  };

  // Save agenda items
  const handleSave = async () => {
    if (agendaItems.length === 0) {
      alert("Please add at least one agenda item.");
      return;
    }

    // Validate all agenda items have titles
    const invalidItems = agendaItems.filter(item => !item.title.trim());
    if (invalidItems.length > 0) {
      alert("All agenda items must have a title.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await onSubmit(agendaItems);
      
      if (result.success) {
        const finalizeResult = await onFinalize();
        if (finalizeResult.success && finalizeResult.redirect) {
          router.push(finalizeResult.redirect);
        }
      } else {
        alert(result.message || "Failed to save agenda items.");
      }
    } catch (error) {
      console.error("Error saving agenda items:", error);
      alert("Failed to save agenda items. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Transform attendees for presenter selection
  const presenters = (attendees || []).map(a => ({
    id: parseInt(a.id),
    name: a.name,
    role: a.role
  }));

  return (
    <div className="space-y-6">
      {/* Meeting Info Header */}
      <Card>
        <CardHeader>
          <CardTitle>{meetingTitle}</CardTitle>
          <CardDescription>
            Add agenda items for this meeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{safeFormatDate(meetingDate, undefined, 'No date')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{safeFormatTime(meetingDate, { hour: '2-digit', minute: '2-digit' }, 'No time')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{attendees.length} attendees</span>
            </div>
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
              <p className="text-muted-foreground mb-4">No agenda items added yet.</p>
              <Button onClick={addAgendaItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Agenda Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agendaItems.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Item {index + 1}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveItemUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveItemDown(index)}
                        disabled={index === agendaItems.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAgendaItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${index}`}>Title *</Label>
                    <Input
                      id={`title-${index}`}
                      value={item.title}
                      onChange={(e) => updateAgendaItem(index, { title: e.target.value })}
                      placeholder="Enter agenda item title"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) => updateAgendaItem(index, { description: e.target.value })}
                      placeholder="Enter detailed description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`duration-${index}`}>Duration (minutes)</Label>
                      <Input
                        id={`duration-${index}`}
                        type="number"
                        min="5"
                        max="180"
                        value={item.duration}
                        onChange={(e) => updateAgendaItem(index, { duration: parseInt(e.target.value) || 15 })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`presenter-${index}`}>Presenter</Label>
                      <Select 
                        value={item.presenter_id?.toString() || ""}
                        onValueChange={(value) => updateAgendaItem(index, { 
                          presenter_id: value ? parseInt(value) : undefined 
                        })}
                      >
                        <SelectTrigger id={`presenter-${index}`}>
                          <SelectValue placeholder="Select presenter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No presenter</SelectItem>
                          {presenters.map((presenter) => (
                            <SelectItem key={presenter.id} value={presenter.id.toString()}>
                              {presenter.name} ({presenter.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Step 1
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/meetings')}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || agendaItems.length === 0}>
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
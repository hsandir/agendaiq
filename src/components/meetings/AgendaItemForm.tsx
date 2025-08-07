"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronUp, 
  ChevronDown, 
  X, 
  GripVertical,
  Clock,
  User,
  AlertCircle
} from "lucide-react";
import type { Priority, Purpose, SolutionType, DecisionType, AgendaItemStatus } from "@prisma/client";

interface Staff {
  id: number;
  name: string;
  initials?: string;
}

export interface AgendaItemFormData {
  topic: string;
  problem_statement?: string;
  staff_initials?: string;
  responsible_staff_id?: number;
  priority: Priority;
  purpose: Purpose;
  proposed_solution?: string;
  solution_type?: SolutionType;
  decisions_actions?: string;
  decision_type?: DecisionType;
  status: AgendaItemStatus;
  future_implications?: boolean;
  duration_minutes?: number;
  order_index: number;
}

interface AgendaItemFormProps {
  item: AgendaItemFormData;
  index: number;
  staff: Staff[];
  onUpdate: (index: number, item: AgendaItemFormData) => void;
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

export function AgendaItemForm({
  item,
  index,
  staff,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: AgendaItemFormProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field: keyof AgendaItemFormData, value: any) => {
    onUpdate(index, { ...item, [field]: value });
  };

  const selectedStaff = staff.find(s => s.id === item.responsible_staff_id);

  return (
    <Card className="mb-4">
      <CardHeader className="cursor-move">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              {item.topic || `Agenda Item ${index + 1}`}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {item.priority && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.priority === 'High' ? 'bg-destructive/10 text-destructive' :
                item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {item.priority}
              </span>
            )}
            {!isFirst && onMoveUp && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onMoveUp(index)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
            {!isLast && onMoveDown && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onMoveDown(index)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Topic and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor={`topic-${index}`}>Topic *</Label>
              <Input
                id={`topic-${index}`}
                value={item.topic}
                onChange={(e) => handleChange('topic', e.target.value)}
                placeholder="Enter agenda topic"
                required
              />
            </div>
            <div>
              <Label htmlFor={`priority-${index}`}>Priority *</Label>
              <Select
                value={item.priority}
                onValueChange={(value) => handleChange('priority', value as Priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Problem Statement */}
          <div>
            <Label htmlFor={`problem-${index}`}>Problem/Need Statement</Label>
            <Textarea
              id={`problem-${index}`}
              value={item.problem_statement || ''}
              onChange={(e) => handleChange('problem_statement', e.target.value)}
              placeholder="Describe the problem or need"
              rows={2}
            />
          </div>

          {/* Purpose and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`purpose-${index}`}>Purpose *</Label>
              <Select
                value={item.purpose}
                onValueChange={(value) => handleChange('purpose', value as Purpose)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Information_Sharing">Information Sharing</SelectItem>
                  <SelectItem value="Discussion">Discussion</SelectItem>
                  <SelectItem value="Decision">Decision</SelectItem>
                  <SelectItem value="Reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`status-${index}`}>Status</Label>
              <Select
                value={item.status}
                onValueChange={(value) => handleChange('status', value as AgendaItemStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Assigned_to_local">Assigned to local</SelectItem>
                  <SelectItem value="Deferred">Deferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsible Staff and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`responsible-${index}`}>Responsible Staff</Label>
              <Select
                value={item.responsible_staff_id?.toString() || ''}
                onValueChange={(value) => handleChange('responsible_staff_id', value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} {s.initials ? `(${s.initials})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`initials-${index}`}>Staff Initials</Label>
              <Input
                id={`initials-${index}`}
                value={item.staff_initials || selectedStaff?.initials || ''}
                onChange={(e) => handleChange('staff_initials', e.target.value)}
                placeholder="e.g., NS"
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor={`duration-${index}`}>Duration (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`duration-${index}`}
                  type="number"
                  value={item.duration_minutes || ''}
                  onChange={(e) => handleChange('duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="15"
                  min="1"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Proposed Solution */}
          <div>
            <Label htmlFor={`solution-${index}`}>Proposed Solution(s)</Label>
            <Textarea
              id={`solution-${index}`}
              value={item.proposed_solution || ''}
              onChange={(e) => handleChange('proposed_solution', e.target.value)}
              placeholder="Describe proposed solutions"
              rows={2}
            />
          </div>

          {/* Solution Type */}
          {item.proposed_solution && (
            <div>
              <Label htmlFor={`solution-type-${index}`}>Type of Solution</Label>
              <Select
                value={item.solution_type || ''}
                onValueChange={(value) => handleChange('solution_type', value as SolutionType || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select solution type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Adaptive">Adaptive</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Decisions & Actions */}
          <div>
            <Label htmlFor={`decisions-${index}`}>Decision(s) & Action(s)</Label>
            <Textarea
              id={`decisions-${index}`}
              value={item.decisions_actions || ''}
              onChange={(e) => handleChange('decisions_actions', e.target.value)}
              placeholder="Document decisions made and actions to be taken"
              rows={3}
            />
          </div>

          {/* Decision Type */}
          {item.decisions_actions && (
            <div>
              <Label htmlFor={`decision-type-${index}`}>Type of Decision</Label>
              <Select
                value={item.decision_type || ''}
                onValueChange={(value) => handleChange('decision_type', value as DecisionType || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decision type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Adaptive">Adaptive</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Future Implications */}
          <div className="flex items-center space-x-2 bg-muted p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <Switch
              id={`implications-${index}`}
              checked={item.future_implications || false}
              onCheckedChange={(checked) => handleChange('future_implications', checked)}
            />
            <Label htmlFor={`implications-${index}`} className="cursor-pointer">
              Decision has future implications
            </Label>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
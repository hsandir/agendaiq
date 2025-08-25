'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  ArrowLeft,
  FileDown,
  AlertCircle,
  CheckCircle,
  Clock,
  users,
  Target,
  Flag,
  Lightbulb,
  Users,
  Copy
} from 'lucide-react'
import { AgendaItemForm, type AgendaItemFormData } from './AgendaItemForm'
import type { AuthenticatedUser } from '@/lib/auth/auth-utils'
import { safeFormatDate } from '@/lib/utils/safe-date'

interface Meeting {
  id: number
  title: string
  start_time: Date | null
  staff: {
    users: {
      name: string | null
      email: string | null
    }
    role: {
      title: string
    }
  }
  department: {
    name: string
  } | null
  meeting_agenda_items: Array<{
    id: number
    topic: string
    problem_statement: string | null
    staff_initials: string | null
    responsible_staff_id: number | null
    priority: string
    purpose: string
    proposed_solution: string | null
    solution_type: string | null
    decisions_actions: string | null
    decision_type: string | null
    status: string
    future_implications: boolean | null
    order_index: number
    duration_minutes: number | null
    carried_forward: boolean
    carry_forward_count: number
    staff: {
      users: {
        name: string | null
        email: string | null
      }
      role: {
        title: string
      }
    } | null
  }>
  meeting_attendee: Array<{
    staff_id: number
    staff: {
      users: {
        name: string | null
        email: string | null
      }
      role: {
        title: string
      }
      department: {
        name: string
      } | null
    }
  }>
}

interface StaffForAgenda {
  id: number
  name: string
  initials?: string
}

interface PastMeeting {
  id: number
  title: string
  start_time: Date | null
  _count: {
    meeting_agenda_items: number
  }
}

interface AgendaItemsEditorProps {
  meeting: Meeting
  currentUser: AuthenticatedUser
  allStaff: StaffForAgenda[]
  pastMeetings: PastMeeting[]
  canEdit: boolean
}

export function AgendaItemsEditor({
  meeting,
  currentUser,
  allStaff,
  pastMeetings,
  canEdit
}: AgendaItemsEditorProps) {
  const router = useRouter()
  const [agendaItems, setAgendaItems] = useState<AgendaItemFormData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedPastMeeting, setSelectedPastMeeting] = useState<number | null>(null)
  const [importedItems, setImportedItems] = useState<AgendaItemFormData[]>([])
  const [importedMeetingId, setImportedMeetingId] = useState<number | null>(null)
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false)

  // State to track if we should auto-add a new item
  const [hasAutoAddedNewItem, setHasAutoAddedNewItem] = useState(false);

  // Initialize agenda items from meeting data - only run once on mount
  useEffect(() => {
    // Only initialize if agendaItems is empty to prevent re-initialization
    if (agendaItems.length > 0) return;
    
    const items: AgendaItemFormData[] = meeting.meeting_agenda_items.map(item => ({
      id: item.id,
      topic: item.topic,
      problem_statement: item.problem_statement ?? undefined,
      staff_initials: item.staff_initials ?? undefined,
      responsible_staff_id: item.responsible_staff_id ?? undefined,
      priority: item.priority as Record<string, unknown>,
      purpose: item.purpose as Record<string, unknown>,
      proposed_solution: item.proposed_solution ?? undefined,
      solution_type: item.solution_type as Record<string, unknown> || undefined,
      decisions_actions: item.decisions_actions ?? undefined,
      decision_type: item.decision_type as Record<string, unknown> || undefined,
      status: item.status as Record<string, unknown>,
      future_implications: item.future_implications ?? false,
      duration_minutes: item.duration_minutes ?? 15,
      carried_forward: item.carried_forward,
      carry_forward_count: item.carry_forward_count,
      order_index: item.order_index
    }))
    
    // Sort items by order_index in descending order (newest first)
    const sortedItems = items.sort((a, b) => b.order_index - a.order_index);
    setAgendaItems(sortedItems);
    
    // Auto-add a new item if the list is empty and user can edit
    if (sortedItems.length === 0 && canEdit && !hasAutoAddedNewItem) {
      const newItem: AgendaItemFormData = {
        topic: '',
        priority: 'Medium',
        purpose: 'Discussion',
        status: 'Pending',
        duration_minutes: 15,
        future_implications: false,
        carried_forward: false,
        carry_forward_count: 0,
        order_index: 0
      };
      setAgendaItems([newItem]);
      setHasAutoAddedNewItem(true);
    }
  }, [])

  const addAgendaItem = () => {
    const newItem: AgendaItemFormData = {
      topic: '',
      priority: 'Medium',
      purpose: 'Discussion',
      status: 'Pending',
      duration_minutes: 15,
      future_implications: false,
      carried_forward: false,
      carry_forward_count: 0,
      order_index: agendaItems.length
    }
    // Add new item at the beginning (newest first)
    setAgendaItems([newItem, ...agendaItems])
  }

  const updateAgendaItem = (index: number, item: AgendaItemFormData) => {
    const newItems = [...agendaItems]
    newItems[index] = item
    setAgendaItems(newItems)
  }

  const removeAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index))
  }

  const moveAgendaItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === agendaItems.length - 1)
    ) {
      return
    }

    const newItems = [...agendaItems]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]]

    // Update order indices
    newItems.forEach((item, idx) => {
      item.order_index = idx
    })

    setAgendaItems(newItems)
  }

  const handleImportFromPastMeeting = async () => {
    if (!selectedPastMeeting) return

    try {
      const response = await fetch(`/api/meetings/${selectedPastMeeting}/agenda-items`)
      const data = await response.json()

      if (data.success && data.items) {
        const imported: AgendaItemFormData[] = data.items.map((item: Record<string, unknown>, index: number) => ({
          topic: item.topic,
          problem_statement: item.problem_statement ?? undefined,
          staff_initials: item.staff_initials ?? undefined,
          responsible_staff_id: item.responsible_staff_id ?? undefined,
          priority: item.priority,
          purpose: item.purpose,
          proposed_solution: item.proposed_solution ?? undefined,
          solution_type: item.solution_type ?? undefined,
          decisions_actions: item.decisions_actions ?? undefined,
          decision_type: item.decision_type ?? undefined,
          status: 'Pending', // Reset status for new meeting
          future_implications: item.future_implications ?? false,
          duration_minutes: item.duration_minutes ?? 15,
          carried_forward: true,
          carry_forward_count: (item.carry_forward_count ?? 0) + 1,
          order_index: agendaItems.length + index,
          parent_item_id: item.id // Link to original item
        }))

        setImportedItems(imported)
        setImportedMeetingId(selectedPastMeeting)
        setAgendaItems([...agendaItems, ...imported])
        setShowImportDialog(false)
        setSuccess(`Imported ${imported.length} agenda items`)
      }
    } catch (error: unknown) {
      setError('Failed to import agenda items')
    }
  }

  const handleRemoveImportedItems = () => {
    if (importedMeetingId) {
      setAgendaItems(agendaItems.filter(item => !importedItems.includes(item)))
      setImportedItems([])
      setImportedMeetingId(null)
      setShowRemoveConfirmation(false)
      setSuccess('Removed imported items')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/meetings/${meeting.id}/agenda-items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: agendaItems.map((item, index) => ({
            ...item,
            // Reverse the order index so newest items get higher indices
            order_index: agendaItems.length - 1 - index
          }))
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('Agenda items saved successfully')
      } else {
        setError(data.error || 'Failed to save agenda items')
      }
    } catch (error: unknown) {
      setError('An error occurred while saving')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Agenda Items</h1>
          <p className="text-muted-foreground mt-2">
            meeting: {meeting.title} • {safeFormatDate(meeting.start_time)}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/meetings/${meeting.id}/edit`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Meeting
        </Button>
      </div>

      {/* Meeting Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meeting Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Organizer</p>
              <p className="font-medium">{meeting.staff.users.name ?? meeting.staff.users.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{meeting.department?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attendees</p>
              <p className="font-medium">{meeting.meeting_attendee.length} people</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agenda Items</p>
              <p className="font-medium">{agendaItems.length} items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex gap-3">
          <Button onClick={addAgendaItem} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Item
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            disabled={pastMeetings.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Import from Past Meeting
          </Button>
          {importedMeetingId && importedItems.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowRemoveConfirmation(true)}
              className="text-destructive"
            >
              Remove Imported Items ({importedItems.length})
            </Button>
          )}
        </div>
      )}

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Agenda Items */}
      <div className="space-y-4">
        {agendaItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No agenda items yet</p>
              {canEdit && (
                <Button onClick={addAgendaItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          agendaItems.map((item, index) => (
            <AgendaItemForm
              key={index}
              item={item}
              index={index}
              staff={allStaff}
              onUpdate={updateAgendaItem}
              onRemove={removeAgendaItem}
              onMoveUp={canEdit ? moveAgendaItem : undefined}
              onMoveDown={canEdit ? moveAgendaItem : undefined}
              isFirst={index === 0}
              isLast={index === agendaItems.length - 1}
              readOnly={!canEdit}
            />
          ))
        )}
      </div>

      {/* Save Button */}
      {canEdit && agendaItems.length > 0 && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Agenda Items'}
          </Button>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Agenda Items from Past Meeting</DialogTitle>
            <DialogDescription>
              Select a past meeting to import its agenda items. Items will be marked as carried forward.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Meeting</Label>
              <Select
                value={selectedPastMeeting?.toString()}
                onValueChange={(value) => setSelectedPastMeeting(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a meeting" />
                </SelectTrigger>
                <SelectContent>
                  {pastMeetings.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id.toString()}>
                      <div className="flex justify-between items-center w-full">
                        <span>{pm.title}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({pm._count.meeting_agenda_items} items)
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {safeFormatDate(pm.start_time)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportFromPastMeeting} disabled={!selectedPastMeeting}>
              <Copy className="h-4 w-4 mr-2" />
              Import Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveConfirmation} onOpenChange={setShowRemoveConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Imported Items?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the {importedItems.length} imported agenda items?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveConfirmation(false)}>
              Keep Items
            </Button>
            <Button variant="destructive" onClick={handleRemoveImportedItems}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
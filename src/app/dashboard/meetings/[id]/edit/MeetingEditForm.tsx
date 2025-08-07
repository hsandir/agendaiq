"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFormatDateTime } from '@/lib/utils/safe-date';

interface MeetingEditFormProps {
  meeting: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    agenda: string;
    notes: string;
    status: string;
    attendees: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
    }>;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  }>;
  meetingId: number;
  isStep2: boolean;
}

export function MeetingEditForm({ meeting, users, meetingId, isStep2 }: MeetingEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agenda, setAgenda] = useState(meeting.agenda);
  const [notes, setNotes] = useState(meeting.notes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agenda,
          notes,
          status: isStep2 ? 'scheduled' : meeting.status
        }),
      });

      if (response.ok) {
        router.push('/dashboard/meetings');
      } else {
        throw new Error('Failed to update meeting');
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      alert('Error updating meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Meeting Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Title:</span> {meeting.title}
            </div>
            <div>
              <span className="font-medium">Status:</span> {meeting.status}
            </div>
            <div>
              <span className="font-medium">Start:</span> {safeFormatDateTime(meeting.startTime, undefined, 'Not set')}
            </div>
            <div>
              <span className="font-medium">End:</span> {safeFormatDateTime(meeting.endTime, undefined, 'Not set')}
            </div>
          </div>
          {meeting.description && (
            <div className="mt-2">
              <span className="font-medium">Description:</span> {meeting.description}
            </div>
          )}
          <div className="mt-2">
            <span className="font-medium">Attendees:</span> {meeting.attendees.length} people
          </div>
        </CardContent>
      </Card>

      {/* Agenda and Content Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="agenda">Agenda Items</Label>
              <Textarea
                id="agenda"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                rows={6}
                placeholder="Enter meeting agenda items..."
                className="mt-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                List the topics and items to be discussed in this meeting
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Notes & Preparation</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any preparation notes or additional information..."
                className="mt-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                Add any preparation notes, background information, or additional details
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            {isStep2 ? 'Back to Step 1' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (isStep2 ? 'Create Meeting' : 'Update Meeting')}
          </Button>
        </div>
      </form>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface MeetingFormProps {
  users: User[];
  onSubmit: (data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    attendeeIds: string[];
  }) => Promise<any>;
  initialData?: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    attendeeIds: string[];
  };
}

export function MeetingForm({ users, onSubmit, initialData }: MeetingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    startTime: initialData?.startTime ?? "",
    endTime: initialData?.endTime ?? "",
    attendeeIds: initialData?.attendeeIds ?? [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      router.push"/dashboard/meetings";
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-ring sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-ring sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-foreground">
            Start Time
          </label>
          <input
            type="datetime-local"
            id="startTime"
            required
            value={formData.startTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startTime: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-ring sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-foreground">
            End Time
          </label>
          <input
            type="datetime-local"
            id="endTime"
            required
            value={formData.endTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endTime: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-ring sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="attendees" className="block text-sm font-medium text-foreground">
          Attendees
        </label>
        <select
          id="attendees"
          multiple
          value={formData.attendeeIds}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions);
            setFormData((prev) => ({
              ...prev,
              attendeeIds: options.map((option) => option.value),
            }));
          }}
          className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-ring sm:text-sm"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-foreground bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
} 
import type { 
  meeting, 
  meeting_agenda_items, 
  meeting_attendee,
  meeting_action_items,
  agenda_item_comments,
  agenda_item_attachments,
  staff,
  users,
  role,
  department,
  district,
  school
} from '@prisma/client';

// Type for staff with related data
export interface StaffWithRelations extends staff {
  users: users;
  role: role;
  department?: department | null;
  school?: school | null;
  district?: district | null;
}

// Type for meeting attendee with relations
export interface AttendeeWithRelations extends meeting_attendee {
  staff: StaffWithRelations;
}

// Type for meeting with all relations
export interface MeetingWithRelations extends meeting {
  staff: StaffWithRelations;
  meeting_attendee: AttendeeWithRelations[];
  meeting_agenda_items?: AgendaItemWithRelations[];
  meeting_action_items?: ActionItemWithRelations[];
  department?: department | null;
  school?: school | null;
  district?: district | null;
}

// Type for agenda item comment with relations
export interface CommentWithRelations extends agenda_item_comments {
  staff: StaffWithRelations;
}

// Type for action item with relations
export interface ActionItemWithRelations extends Omit<meeting_action_items, 'assigned_to'> {
  assigned_to: StaffWithRelations | null;
}

// Type for agenda item with all relations
export interface AgendaItemWithRelations extends meeting_agenda_items {
  meeting: MeetingWithRelations;
  responsible_staff: StaffWithRelations | null;
  Comments: CommentWithRelations[];
  ActionItems: ActionItemWithRelations[];
  Attachments: agenda_item_attachments[];
  _count?: {
    Comments: number;
    ActionItems: number;
  };
}

// Simple staff for dropdowns/assignment
export interface StaffForAssignment {
  id: number;
  users: {
    id: number;  // Changed from string to number to match Prisma schema
    name: string | null;
    email: string;
  };
  role: {
    id: number;
    title: string;
  };
  Department?: {
    id: number;
    name: string;
  } | null;
}

// Use AuthenticatedUser from auth-utils instead of defining our own
export { type AuthenticatedUser as AuthUser } from '@/lib/auth/auth-utils';

// API Response types
export interface MeetingResponse {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  zoomLink: string | null;
  status: string;
  organizer: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  };
  attendees: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    status: string;
  }[];
}

// API Request types
export interface CreateMeetingRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  zoomLink?: string;
  attendeeIds?: number[];
  agendaItems?: {
    topic: string;
    purpose: string;
    priority?: string;
    responsibleStaffId?: number;
  }[];
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  zoomLink?: string;
  agenda?: string;
  notes?: string;
  status?: string;
}

// Meeting update data with proper types
export interface MeetingUpdateData {
  title?: string;
  description?: string;
  start_time?: Date;
  end_time?: Date;
  agenda?: string;
  notes?: string;
  status?: string;
  zoom_join_url?: string;
}
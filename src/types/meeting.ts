import type { 
  Meeting, 
  MeetingAgendaItem, 
  MeetingAttendee,
  MeetingActionItem,
  AgendaItemComment,
  AgendaItemAttachment,
  Staff,
  User,
  Role,
  Department,
  District,
  School
} from '@prisma/client';

// Type for staff with related data
export interface StaffWithRelations extends Staff {
  User: User;
  Role: Role;
  Department?: Department | null;
  School?: School | null;
  District?: District | null;
}

// Type for meeting attendee with relations
export interface AttendeeWithRelations extends MeetingAttendee {
  Staff: StaffWithRelations;
}

// Type for meeting with all relations
export interface MeetingWithRelations extends Meeting {
  Staff: StaffWithRelations;
  meeting_attendee: AttendeeWithRelations[];
  MeetingAgendaItems?: AgendaItemWithRelations[];
  MeetingActionItems?: ActionItemWithRelations[];
  Department?: Department | null;
  School?: School | null;
  District?: District | null;
}

// Type for agenda item comment with relations
export interface CommentWithRelations extends AgendaItemComment {
  Staff: StaffWithRelations;
}

// Type for action item with relations
export interface ActionItemWithRelations extends MeetingActionItem {
  assigned_to: StaffWithRelations | null;
}

// Type for agenda item with all relations
export interface AgendaItemWithRelations extends MeetingAgendaItem {
  meeting: MeetingWithRelations;
  responsible_staff: StaffWithRelations | null;
  Comments: CommentWithRelations[];
  ActionItems: ActionItemWithRelations[];
  Attachments: AgendaItemAttachment[];
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
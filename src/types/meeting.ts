import { Meeting, MeetingAttendee, Staff, User, Role, Department, MeetingAgendaItem, MeetingActionItem } from '@prisma/client';

// Type for staff with related data
export interface StaffWithRelations extends Staff {
  User: Pick<User, 'id' | 'name' | 'email'>;
  Role: Role;
  Department?: Department;
}

// Type for meeting attendee with relations
export interface AttendeeWithRelations extends MeetingAttendee {
  Staff: StaffWithRelations;
}

// Type for meeting with all relations
export interface MeetingWithRelations extends Meeting {
  Staff: StaffWithRelations;
  MeetingAttendee: AttendeeWithRelations[];
  MeetingAgendaItems?: MeetingAgendaItem[];
  MeetingActionItems?: MeetingActionItem[];
  Department?: Department;
}

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
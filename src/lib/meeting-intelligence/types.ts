// Meeting Intelligence Types and Interfaces

export interface MeetingContinuityData {
  parentMeetingId?: number;
  carriedItems: CarriedAgendaItem[];
  pendingActions: PendingActionItem[];
  continuationNotes?: string;
}

export interface CarriedAgendaItem {
  id?: number;
  parentItemId?: number;
  topic: string;
  problemStatement?: string;
  responsibleRoleId?: number;
  responsibleStaffId?: number;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Ongoing' | 'Deferred' | 'CarriedForward';
  carryForwardCount: number;
  notes?: string;
}

export interface PendingActionItem {
  id?: number;
  parentActionId?: number;
  title: string;
  description?: string;
  assignedToRoleId?: number;
  assignedToStaffId?: number;
  dueDate?: Date;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'InProgress' | 'Overdue';
  carryForwardCount: number
}

export interface RoleTransitionData {
  roleId: number;
  fromStaffId: number;
  toStaffId: number;
  pendingTasks: number[];
  transferredItems: number[];
  notes?: string;
}

export interface MeetingSearchQuery {
  query: string;
  filters?: {
    departmentId?: number;
    roleId?: number;
    staffId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    status?: string[];
    tags?: string[];
  };
  limit?: number;
  offset?: number;
}

export interface MeetingSearchResult {
  meetingId: number;
  title: string;
  excerpt: string;
  relevance: number;
  date: Date;
  matchedIn: 'title' | 'agenda' | 'notes' | 'actions' | 'transcript'
}

export interface MeetingAnalytics {
  totalMeetings: number;
  completedActions: number;
  pendingActions: number;
  overdueActions: number;
  averageDuration: number;
  participationRate: number;
  carryForwardRate: number;
  departmentBreakdown: DepartmentStats[];
}

export interface DepartmentStats {
  departmentId: number;
  departmentName: string;
  meetingCount: number;
  actionItemCount: number;
  completionRate: number;
  averageAttendance: number
}

export interface AIPlaceholder {
  type: 'summary' | 'actionExtraction' | 'transcription' | 'smartSearch';
  input: Record<string, unknown>;
  manualFallback?: Record<string, unknown>;
  futureImplementation: string
}

export const ActionItemStatus = {
  Pending: 'Pending',
  InProgress: 'InProgress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  Deferred: 'Deferred',
  Overdue: 'Overdue'
} as const;

export const AgendaItemStatus = {
  Ongoing: 'Ongoing',
  Resolved: 'Resolved',
  AssignedToLocal: 'Assigned_to_local',
  Pending: 'Pending',
  Deferred: 'Deferred',
  CarriedForward: 'CarriedForward'
} as const;
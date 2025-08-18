/**
 * API Response types for monitoring and external services
 */

export interface SentryHealthData {
  adoption: number;
  sessions: number;
  crashFreeUsers: number;
  healthData: unknown[];
  totalEvents: number;
  newGroups: number;
}

export interface UptimeData {
  uptime: number;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  responseTime: number;
}

export interface PusherAuthRequest {
  socket_id: string;
  channel_name: string;
}

export interface DepartmentAssignmentRequest {
  userId: string;
  departmentId: string;
}

export interface HierarchyRole {
  id: string;
  title: string;
  parent_id: string | null;
  Children?: HierarchyRole[];
}
/**
 * Type definitions for monitoring API responses
 * Used in test files to ensure type safety
 */

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  level: 'error' | 'warning' | 'info' | 'debug' | 'fatal';
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  status: 'resolved' | 'unresolved' | 'ignored';
  isRegression: boolean;
  platform: string;
  lastRelease?: {
    version: string
  };
  assignedTo?: {
    name: string
  };
}

export interface ErrorsResponse {
  issues: SentryIssue[];
  message?: string;
}

export interface ErrorStats {
  crashFreeUsers: number;
  crashFreeSessions: number;
  errorRate: number;
  activeIssues: number;
  newIssues24h: number;
  resolvedIssues24h: number;
  p95ResponseTime: number;
  affectedUsers: number
}

export interface ErrorStatsResponse {
  stats: ErrorStats
}

export interface ReleaseHealth {
  version: string;
  adoptionRate: number;
  crashFreeRate: number;
  sessionCount: number;
  errorCount: number;
  newIssues: number;
  status: 'healthy' | 'degraded' | 'critical'
}

export interface ReleaseHealthResponse {
  release: ReleaseHealth
}

export interface SentryStatsData {
  data: Array<[number, Array<{ count: number }>]>;
}

export interface SentryReleaseData {
  adoption?: number;
  sessions?: number;
  crashFreeUsers?: number;
  totalEvents?: number;
  newGroups?: number;
}
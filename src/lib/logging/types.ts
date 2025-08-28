/**
 * Professional Logging System Types
 * Two-layer logging architecture:
 * 1. Development/Admin Logging - Technical debugging and system monitoring
 * 2. Security/Audit Logging - User tracking, compliance, and security monitoring
 */

// Log Levels
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

// Log Categories for Development/Admin Logging
export enum DevLogCategory {
  SYSTEM = 'system',
  DATABASE = 'database',
  API = 'api',
  AUTH = 'auth',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  NETWORK = 'network',
  CACHE = 'cache',
  EXTERNAL = 'external',
  BUILD = 'build'
}

// Log Categories for Security/Audit Logging
export enum AuditLogCategory {
  USER_ACTION = 'user_action',
  LOGIN_ATTEMPT = 'login_attempt',
  PERMISSION_CHECK = 'permission_check',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  ADMIN_ACTION = 'admin_action',
  SECURITY_VIOLATION = 'security_violation',
  COMPLIANCE = 'compliance',
  EXPORT = 'export',
  IMPORT = 'import'
}

// Base Log Entry Interface
export interface BaseLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  context?: {
    userId?: string;
    staffId?: string;
    sessionId?: string;
    userAgent?: string;
    ip?: string;
    path?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
  };
}

// Development/Admin Log Entry
export interface DevLogEntry extends BaseLogEntry {
  category: DevLogCategory;
  component?: string;
  function?: string;
  file?: string;
  line?: number;
  stack?: string;
  performance?: {
    duration: number;
    memoryUsage?: number;
    cpuUsage?: number;
    queryCount?: number;
  };
  environment: 'development' | 'staging' | 'production'
}

// Security/Audit Log Entry
export interface AuditLogEntry extends BaseLogEntry {
  category: AuditLogCategory;
  actor: {
    userId: string;
    staffId?: string;
    email: string;
    role?: string;
    department?: string;
  };
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  action: string;
  result: 'success' | 'failure' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  compliance?: {
    regulation?: string[];
    dataClassification?: string;
    retention?: string;
  };
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
}

// Log Query Interface
export interface LogQuery {
  level?: LogLevel[];
  category?: string[];
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  component?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'level';
  orderDirection?: 'asc' | 'desc';
}

// Log Stats Interface
export interface LogStats {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByCategory: Record<string, number>;
  timeRange: {
    start: string;
    end: string
  };
  topErrors?: Array<{
    message: string;
    count: number;
    lastSeen: string
  }>;
  performanceMetrics?: {
    averageResponseTime: number;
    slowestEndpoints: Array<{
      path: string;
      averageTime: number
    }>;
  };
}

// Log Transport Interface
export interface LogTransport {
  name: string;
  level: LogLevel;
  write(entry: BaseLogEntry): Promise<void>;
  query?(query: LogQuery): Promise<BaseLogEntry[]>;
  stats?(): Promise<LogStats>;
}

// Logger Configuration
export interface LoggerConfig {
  level: LogLevel;
  transports: LogTransport[];
  context?: Record<string, unknown>;
  enablePerformanceTracking?: boolean;
  enableErrorTracking?: boolean;
  bufferSize?: number;
  flushInterval?: number;
}

// Real-time Log Event for Live Monitoring
export interface LiveLogEvent extends BaseLogEntry {
  source: 'dev' | 'audit';
  category: DevLogCategory | AuditLogCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  correlationId?: string;
}

// Log Alert Configuration
export interface LogAlert {
  id: string;
  name: string;
  condition: {
    level?: LogLevel;
    category?: string[];
    pattern?: string;
    threshold?: {
      count: number;
      timeWindow: number; // minutes
    };
  };
  actions: Array<{
    type: 'email' | 'webhook' | 'notification';
    config: Record<string, unknown>;
  }>;
  enabled: boolean
}

// Export main types
export type LogEntry = DevLogEntry | AuditLogEntry;
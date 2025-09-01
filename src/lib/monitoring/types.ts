/**
 * Monitoring System Types
 * Provider-agnostic types for monitoring system
 */

export interface MonitoringConfig {
  provider: 'sentry' | 'datadog' | 'newrelic' | 'posthog' | 'custom' | 'disabled';
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  debug?: boolean;
  dsn?: string;
  release?: string;
  sampleRates?: SampleRates;
  integrations?: MonitoringIntegration[];
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null;
  tags?: Record<string, string>;
}

export interface SampleRates {
  error: number;
  trace: number;
  replay: number;
  session: number;
  profile?: number;
}

export interface ErrorEvent {
  message?: string;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  timestamp?: number;
  platform?: string;
  logger?: string;
  tags?: Record<string, string>;
  user?: UserContext;
  request?: RequestContext;
  contexts?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
  exception?: ExceptionInfo;
  breadcrumbs?: Breadcrumb[];
}

export interface UserContext {
  id?: string;
  username?: string;
  email?: string;
  tenant_id?: string;
  role?: string;
  segment?: string;
}

export interface RequestContext {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  query_string?: string;
  data?: unknown;
  cookies?: string;
  env?: Record<string, string>;
}

export interface ExceptionInfo {
  type?: string;
  value?: string;
  stacktrace?: StackTrace;
  mechanism?: {
    type?: string;
    handled?: boolean;
  };
}

export interface StackTrace {
  frames?: StackFrame[];
}

export interface StackFrame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  abs_path?: string;
  context_line?: string;
  pre_context?: string[];
  post_context?: string[];
  in_app?: boolean;
}

export interface Breadcrumb {
  timestamp?: number;
  type?: 'default' | 'debug' | 'error' | 'navigation' | 'http' | 'info' | 'query' | 'transaction' | 'ui' | 'user';
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
}

export interface MonitoringIntegration {
  name: string;
  enabled: boolean;
  options?: Record<string, unknown>;
}

export interface Transaction {
  name: string;
  op?: string;
  tags?: Record<string, string>;
  data?: Record<string, unknown>;
  startTimestamp?: number;
  endTimestamp?: number;
  status?: 'ok' | 'cancelled' | 'unknown' | 'invalid_argument' | 'deadline_exceeded' | 'not_found' | 'already_exists' | 'permission_denied' | 'resource_exhausted' | 'failed_precondition' | 'aborted' | 'out_of_range' | 'unimplemented' | 'internal_error' | 'unavailable' | 'data_loss' | 'unauthenticated';
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  op?: string;
  description?: string;
  status?: string;
  tags?: Record<string, string>;
  data?: Record<string, unknown>;
  startTimestamp?: number;
  endTimestamp?: number;
}

export interface CronJob {
  monitorSlug: string;
  status: 'in_progress' | 'ok' | 'error';
  checkInId?: string;
  duration?: number;
  environment?: string;
}

export interface Performance {
  navigation?: PerformanceNavigationTiming;
  resource?: PerformanceResourceTiming[];
  paint?: PerformancePaintTiming[];
  measure?: PerformanceMeasure[];
  mark?: PerformanceMark[];
  lcp?: number;
  fcp?: number;
  cls?: number;
  fid?: number;
  inp?: number;
  ttfb?: number;
}

export interface PerformanceNavigationTiming {
  domContentLoadedEventEnd?: number;
  domContentLoadedEventStart?: number;
  domInteractive?: number;
  loadEventEnd?: number;
  loadEventStart?: number;
  requestStart?: number;
  responseEnd?: number;
  responseStart?: number;
}

export interface PerformanceResourceTiming {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  initiatorType?: string;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

export interface PerformancePaintTiming {
  name: string;
  entryType: string;
  startTime: number;
  duration: number
}

export interface PerformanceMeasure {
  name: string;
  entryType: string;
  startTime: number;
  duration: number
}

export interface PerformanceMark {
  name: string;
  entryType: string;
  startTime: number;
  duration: number
}

export interface Alert {
  id: string;
  name: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  environment?: string[];
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
  value: number;
  window?: number; // in minutes
}

export interface AlertAction {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook';
  config: Record<string, unknown>;
}

export interface MonitoringProvider {
  // Core methods
  init(config: MonitoringConfig): void;
  captureException(error: Error, context?: Record<string, unknown>): void;
  captureMessage(message: string, level?: string, context?: Record<string, unknown>): void;
  
  // User context
  setUser(user: UserContext | null): void;
  
  // Tags and context
  setTags(tags: Record<string, string>): void;
  setTag(key: string, value: string): void;
  setContext(key: string, context: Record<string, unknown>): void;
  
  // Breadcrumbs
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  
  // Performance
  startTransaction(name: string, op?: string): Transaction;
  finishTransaction(transaction: Transaction): void;
  
  // Profiling
  startProfiler?(): void;
  stopProfiler?(): void;
  
  // Cron monitoring
  captureCheckIn?(checkIn: CronJob): void;
  
  // Session replay
  startReplay?(): void;
  stopReplay?(): void;
  
  // Custom events
  captureEvent?(event: ErrorEvent): void;
  
  // Cleanup
  close?(timeout?: number): Promise<boolean>;
}
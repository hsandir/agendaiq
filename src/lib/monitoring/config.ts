/**
 * Centralized Monitoring Configuration
 * All monitoring settings in one place for easy management
 */

import { MonitoringConfig, SampleRates } from './types';

// Environment detection
const ENV = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = ENV === 'production';
const IS_STAGING = process.env.VERCEL_ENV === 'preview';
const IS_DEVELOPMENT = ENV === 'development';
const IS_SERVER = typeof window === 'undefined';

// Version and release information
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const GIT_COMMIT = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unknown';
const RELEASE_NAME = `agendaiq@${IS_SERVER ? 'api' : 'web'}@${APP_VERSION}+${GIT_COMMIT}`;

// DSN Configuration (Sentry specific but abstracted)
const DSN = IS_SERVER 
  ? process.env.SENTRY_DSN 
  : process.env.NEXT_PUBLIC_SENTRY_DSN;

// Sample rates per environment
const SAMPLE_RATES: Record<string, SampleRates> = {
  development: {
    error: 1.0,      // Capture all errors in dev
    trace: 0.3,      // 30% of transactions
    replay: 0,       // No replays in dev
    session: 0,      // No session tracking
    profile: 0,      // No profiling
  },
  staging: {
    error: 1.0,      // Capture all errors
    trace: 0.2,      // 20% of transactions
    replay: 0.1,     // 10% error replays
    session: 0,      // No session tracking
    profile: 0.05,   // 5% profiling
  },
  production: {
    error: 1.0,      // Capture all errors
    trace: 0.1,      // 10% of transactions (will be dynamic)
    replay: 0.05,    // 5% error replays (reduced from 100%)
    session: 0.001,  // 0.1% session replays (reduced from 10%)
    profile: 0.01,   // 1% profiling
  },
};

// Ignore patterns for noise reduction
export const IGNORE_ERRORS = [
  // Network errors
  'NetworkError',
  'Failed to fetch',
  'Load failed',
  'fetch failed',
  'AbortError',
  'The operation was aborted',
  
  // Browser quirks
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Non-Error promise rejection captured',
  
  // Browser extensions
  'top.GLOBALS',
  'Extension context invalidated',
  'chrome-extension://',
  'moz-extension://',
  
  // React/Next.js specific
  'ChunkLoadError',
  'Loading chunk',
  'Hydration failed',
  'There was an error while hydrating',
  'Text content does not match server-rendered HTML',
  
  // Media/Audio errors
  'The play() request was interrupted',
  'NotAllowedError',
  
  // Connection errors (already handled)
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
];

// URL patterns to deny (reduce noise from extensions and third-party scripts)
export const DENY_URLS = [
  // Browser extensions
  /extensions\//i,
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-extension:\/\//i,
  
  // Social media widgets
  /graph\.facebook\.com/i,
  /connect\.facebook\.net/i,
  /twitter\.com\/widgets/i,
  /platform\.twitter\.com/i,
  /syndication\.twitter\.com/i,
  
  // Analytics and tracking
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /google\.com\/recaptcha/i,
  /gstatic\.com/i,
  /doubleclick\.net/i,
  /google\.com\/pagead/i,
  /googlesyndication\.com/i,
  /adnxs\.com/i,
  /google-analytics\.com/i,
  /hotjar\.com/i,
  /mixpanel\.com/i,
  /segment\.com/i,
  /segment\.io/i,
  
  // CDNs and external scripts
  /cdn\.jsdelivr\.net/i,
  /unpkg\.com/i,
  /cdnjs\.cloudflare\.com/i,
  
  // Development tools
  /localhost:3001/i,  // Webpack dev server
  /localhost:8080/i,  // Common dev ports
  /127\.0\.0\.1/i,
  /:3001\/isrunning/i,
];

// Allowed URLs (only track errors from our domains)
export const ALLOW_URLS = [
  /https:\/\/(.+\.)?agendaiq\.com/,
  /https:\/\/(.+\.)?agendaiq\.app/,
  /http:\/\/localhost:3000/,
];

// Sensitive data patterns for masking
export const SENSITIVE_PATTERNS = {
  email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  phone: /(\+?[0-9]{1,3}[-.\s]?\(?[0-9]{1,3}\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4})/gi,
  tcno: /\b[1-9][0-9]{10}\b/g,
  iban: /[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}/gi,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  apiKey: /(api[_-]?key|apikey|api_secret)([\'\"\\s:=]+)([a-zA-Z0-9_-]{20,})/gi,
  token: /(token|bearer|jwt|access_token|refresh_token)([\'\"\\s:=]+)([a-zA-Z0-9_-]{20,})/gi,
  password: /(password|passwd|pwd)([\'\"\\s:=]+)([^\s\"\']+)/gi,
  secret: /(secret|private_key)([\'\"\\s:=]+)([^\s\"\']+)/gi,
};

// Sensitive field names to redact
export const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'token',
  'api_key',
  'apiKey',
  'api_secret',
  'apiSecret',
  'secret',
  'private_key',
  'privateKey',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'authorization',
  'cookie',
  'session',
  'sessionId',
  'session_id',
  'credit_card',
  'creditCard',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
  'ssn',
  'social_security',
  'tc_kimlik',
  'tcKimlik',
  'iban',
];

// Tags to be added to all events
export const DEFAULT_TAGS: Record<string, string> = {
  service: IS_SERVER ? 'api' : 'web',
  environment: ENV,
  region: process.env.VERCEL_REGION || 'eu-west-1',
  deployment_id: process.env.VERCEL_DEPLOYMENT_ID ?? 'local',
  commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
  branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'unknown',
  runtime: IS_SERVER ? 'node' : 'browser',
  ...(IS_SERVER && process.version ? { node_version: process.version } : {}),
};

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Web Vitals thresholds (in ms)
  lcp: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint
  fcp: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint
  fid: { good: 100, needs_improvement: 300 },   // First Input Delay
  inp: { good: 200, needs_improvement: 500 },   // Interaction to Next Paint
  cls: { good: 0.1, needs_improvement: 0.25 },  // Cumulative Layout Shift
  ttfb: { good: 800, needs_improvement: 1800 }, // Time to First Byte
  
  // Transaction thresholds (in ms)
  api: {
    auth: { p50: 100, p95: 300, p99: 500 },
    meetings: { p50: 200, p95: 500, p99: 1000 },
    staff: { p50: 150, p95: 400, p99: 800 },
    reports: { p50: 500, p95: 1500, p99: 3000 },
    default: { p50: 200, p95: 500, p99: 1000 },
  },
};

// Alert thresholds
export const ALERT_THRESHOLDS = {
  // Error thresholds
  errorRate: { warning: 0.005, critical: 0.01 }, // 0.5% warning, 1% critical
  errorSpike: { multiplier: 3, window: 15 },     // 3x increase in 15 minutes
  
  // Crash thresholds
  crashFreeUsers: { warning: 0.995, critical: 0.99 },     // 99.5% warning, 99% critical
  crashFreeSessions: { warning: 0.99, critical: 0.985 },  // 99% warning, 98.5% critical
  
  // Performance thresholds
  latencyP95: { warning: 1000, critical: 2000 }, // 1s warning, 2s critical
  latencyP99: { warning: 2000, critical: 3000 }, // 2s warning, 3s critical
  
  // Throughput thresholds
  throughputDrop: { warning: 0.3, critical: 0.5 }, // 30% warning, 50% critical
};

// Create the main configuration
export function getMonitoringConfig(): MonitoringConfig {
  const sampleRates = SAMPLE_RATES[ENV] || SAMPLE_RATES.development;
  
  return {
    provider: 'posthog' as const, // Now using PostHog for monitoring
    enabled: true, // Enable PostHog monitoring
    environment: ENV as 'development' | 'staging' | 'production',
    debug: IS_DEVELOPMENT && process.env.DEBUG_MONITORING === 'true',
    dsn: DSN,
    release: RELEASE_NAME,
    sampleRates,
    tags: DEFAULT_TAGS,
    integrations: [
      {
        name: 'BrowserTracing',
        enabled: !IS_SERVER,
        options: {
          tracingOrigins: ['localhost', 'agendaiq.com', 'agendaiq.app', /^\//],
          routingInstrumentation: 'react-router',
        },
      },
      {
        name: 'Replay',
        enabled: !IS_SERVER && (IS_PRODUCTION ?? IS_STAGING),
        options: {
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: false,
          sampling: {
            sessionSampleRate: sampleRates.session,
            errorSampleRate: sampleRates.replay,
          },
        },
      },
      {
        name: 'ProfileIntegration',
        enabled: IS_SERVER && (IS_PRODUCTION ?? IS_STAGING),
        options: {
          profilesSampleRate: sampleRates.profile,
        },
      },
    ],
  };
}

// Dynamic sampling rules
export function getDynamicSampleRate(context: {
  url?: string;
  error?: boolean;
  userId?: string;
  isVIP?: boolean;
}): number {
  // Always sample errors
  if (context.error) return 1.0;
  
  // VIP users get higher sampling
  if (context.isVIP) return 0.5;
  
  // Health checks get no sampling
  if (context.url?.includes('/api/health')) return 0;
  if (context.url?.includes('/api/ping')) return 0;
  
  // Critical paths get higher sampling
  const criticalPaths = [
    '/api/auth',
    '/api/meetings',
    '/api/payments',
    '/api/reports',
  ];
  
  if (criticalPaths.some(path => context.url?.includes(path))) {
    return IS_PRODUCTION ? 0.3 : 0.5;
  }
  
  // Default sampling
  return SAMPLE_RATES[ENV]?.trace ?? 0.1;
}

// Helper to mask sensitive data
export function maskSensitiveData(str: string): string {
  let masked = str;
  
  Object.entries(SENSITIVE_PATTERNS).forEach(([key, pattern]) => {
    masked = masked.replace(pattern, `[${key.toUpperCase()}_REDACTED]`);
  });
  
  return masked;
}

// Helper to remove sensitive fields from objects
export function removeSensitiveFields<T extends object>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = Array.isArray(obj) ? [...obj] : { ...obj };
  
  if (Array.isArray(cleaned)) {
    return cleaned.map(item => removeSensitiveFields(item)) as T;
  }
  
  for (const key in cleaned) {
    if (Object.prototype.hasOwnProperty.call(cleaned, key)) {
      const lowerKey = key.toLowerCase();
      const value = cleaned[key];
      
      // Check if field name is sensitive
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        Object.assign(cleaned, { [key]: '[REDACTED]' });
      } else if (typeof value === 'object' && value !== null) {
        // Recursively clean nested objects
        Object.assign(cleaned, { [key]: removeSensitiveFields(value) });
      } else if (typeof value === 'string') {
        // Mask sensitive patterns in string values
        Object.assign(cleaned, { [key]: maskSensitiveData(value) });
      }
    }
  }
  
  return cleaned as T;
}

// Export a ready-to-use configuration
export const MONITORING_CONFIG = getMonitoringConfig();
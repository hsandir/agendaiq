import posthog from 'posthog-js';
import { User } from '@prisma/client';

/**
 * Sets user context in PostHog for better analytics and error tracking
 */
export function setPostHogUser(user: Partial<User> & { 
  staff?: { 
    id: string | number; 
    role: { key?: string | null; title?: string | null } 
  } 
}) {
  if (typeof window !== 'undefined' && posthog) {
    // Identify user in PostHog
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      staffId: typeof user.staff?.id === 'number' ? user.staff?.id : Number(user.staff?.id),
      roleKey: user.staff?.role.key ?? 'unknown',
      roleTitle: user.staff?.role.key ?? 'unknown',
      createdAt: user.createdAt,
    });

    // Set user properties for error tracking
    posthog.setPersonProperties({
      email: user.email,
      name: user.name,
      roleKey: user.staff?.role.key ?? 'unknown',
      roleTitle: user.staff?.role.key ?? 'unknown',
    });
  }
}

/**
 * Clears user context in PostHog (on logout)
 */
export function clearPostHogUser() {
  if (typeof window !== 'undefined' && posthog) {
    posthog.reset();
  }
}

/**
 * Captures an exception in PostHog
 */
export function captureException(error: Error | string, context?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    posthog.capture('$exception', {
      $exception_message: errorMessage,
      $exception_stack_trace_raw: errorStack,
      $exception_type: typeof error === 'string' ? 'string' : error.name,
      ...context,
    });
  }
  
  // Also log to console for development
  console.error('Exception captured:', error, context);
}

/**
 * Adds a breadcrumb to PostHog for better error context
 */
export function addPostHogBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  if (typeof window !== 'undefined' && posthog) {
    // PostHog doesn't have breadcrumbs like Sentry, but we can capture custom events
    posthog.capture('breadcrumb', {
      message,
      category,
      level,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
  
  // Log for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${category}] ${message}`, data);
  }
}

/**
 * Track custom events in PostHog
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(eventName, properties);
  }
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, properties?: Record<string, any>) {
  trackEvent('feature_used', {
    feature: featureName,
    ...properties,
  });
}

/**
 * Track API errors
 */
export function trackAPIError(endpoint: string, error: any, statusCode?: number) {
  trackEvent('api_error', {
    endpoint,
    error: error?.message || error,
    statusCode,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track page performance
 */
export function trackPagePerformance(pageName: string, loadTime: number) {
  trackEvent('page_performance', {
    page: pageName,
    loadTime,
    timestamp: new Date().toISOString(),
  });
}
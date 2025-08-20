// Sentry disabled - subscription expired
import { User } from '@prisma/client';

/**
 * Sets user context (Sentry disabled - no-op)
 */
export function setSentryUser(user: Partial<User> & { 
  staff?: { 
    id: string; 
    role: { title: string } 
  } 
}) {
  // No-op - Sentry disabled
  console.log('User context:', user.email);
}

/**
 * Clears user context (Sentry disabled - no-op)
 */
export function clearSentryUser() {
  // No-op - Sentry disabled
}

/**
 * Adds a breadcrumb (Sentry disabled - no-op)
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  // No-op - Sentry disabled
  console.log(`[${category}] ${message}`, data);
}

/**
 * Captures an exception (Sentry disabled - logs to console)
 */
export function captureException(error: Error, context?: Record<string, any>) {
  console.error('Exception captured:', error, context);
}
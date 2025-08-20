// Redirect to PostHog implementation
import { User } from '@prisma/client';
import { 
  setPostHogUser, 
  clearPostHogUser, 
  captureException as posthogCaptureException,
  addPostHogBreadcrumb 
} from '@/lib/posthog/posthog-utils';

/**
 * Sets user context (now using PostHog)
 */
export function setSentryUser(user: Partial<User> & { 
  staff?: { 
    id: string; 
    role: { title: string } 
  } 
}) {
  setPostHogUser(user);
}

/**
 * Clears user context (now using PostHog)
 */
export function clearSentryUser() {
  clearPostHogUser();
}

/**
 * Adds a breadcrumb (now using PostHog)
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  addPostHogBreadcrumb(message, category, level, data);
}

/**
 * Captures an exception (now using PostHog)
 */
export function captureException(error: Error, context?: Record<string, any>) {
  posthogCaptureException(error, context);
}
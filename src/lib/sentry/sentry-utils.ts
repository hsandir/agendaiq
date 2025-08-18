import * as Sentry from '@sentry/nextjs';
import { User } from '@prisma/client';

/**
 * Sets user context in Sentry for better error tracking
 */
export function setSentryUser(user: Partial<User> & { 
  staff?: { 
    id: string; 
    role: { title: string } 
  } 
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
    username: user.name || undefined,
    staffId: (user as any).staff?.id,
    role: (user as any).staff?.role.title,
  });
}

/**
 * Clears user context in Sentry (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Adds a breadcrumb to Sentry for better error context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Captures a message with additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext('additional', context);
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Captures an exception with additional context
 */
export function captureException(
  error: Error,
  context?: Record<string, any>,
  user?: { id?: string; email?: string; staffId?: string }
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional', context);
    }
    
    if (user) {
      scope.setUser({
        id: user.id,
        email: user.email,
        staffId: user.staffId
      });
    }
    
    Sentry.captureException(error);
  });
}

/**
 * Starts a new transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): ReturnType<typeof Sentry.startInactiveSpan> | undefined {
  if (process.env.NODE_ENV === 'production') {
    return Sentry.startInactiveSpan({
      name,
      op,
    });
  }
  return undefined;
}

/**
 * Wraps a function with error tracking
 */
export function withSentry<T extends (...args: Record<string, unknown>[]) => any>(
  fn: T,
  options?: {
    name?: string;
    op?: string;
    captureError?: boolean;
  }
): T {
  return ((...args: Parameters<T>) => {
    const transaction = options?.name 
      ? startTransaction(options.name, options.op || 'function')
      : undefined;
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result
          .catch((error) => {
            if (options?.captureError !== false) {
              captureException(error, {
                function: options?.name || fn.name,
                args: args.length <= 3 ? args : 'Too many args to log',
              });
            }
            throw error;
          })
          .finally(() => {
            transaction?.end();
          });
      }
      
      transaction?.end();
      return result;
    } catch (error: unknown) {
      transaction?.end();
      
      if (options?.captureError !== false) {
        captureException(error as Error, {
          function: options?.name || fn.name,
          args: args.length <= 3 ? args : 'Too many args to log',
        });
      }
      
      throw error;
    }
  }) as T;
}

/**
 * Custom Sentry tags for the application
 */
export const SentryTags = {
  setFeature: (feature: string) => Sentry.setTag('feature', feature),
  setAction: (action: string) => Sentry.setTag('action', action),
  setUserId: (userId: string) => Sentry.setTag('user.id', userId),
  setStaffId: (staffId: string) => Sentry.setTag('staff.id', staffId),
  setSchoolId: (schoolId: string) => Sentry.setTag('school.id', schoolId),
  setDistrictId: (districtId: string) => Sentry.setTag('district.id', districtId),
} as const;

/**
 * Performance monitoring utilities
 */
export const Performance = {
  /**
   * Measures database query performance
   */
  measureQuery: async <T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> => {
    const transaction = startTransaction(`db.${queryName}`, 'db.query');
    
    try {
      const result = await queryFn();
      // SpanStatus type changed in newer Sentry versions
      // Using setHttpStatus instead for compatibility
      transaction?.setHttpStatus?.(200);
      return result;
    } catch (error: unknown) {
      transaction?.setHttpStatus?.(500);
      throw error;
    } finally {
      transaction?.end();
    }
  },
  
  /**
   * Measures API route performance
   */
  measureRoute: async <T>(
    routeName: string,
    routeFn: () => Promise<T>
  ): Promise<T> => {
    const transaction = startTransaction(`api.${routeName}`, 'http.server');
    
    try {
      const result = await routeFn();
      // SpanStatus type changed in newer Sentry versions
      // Using setHttpStatus instead for compatibility
      transaction?.setHttpStatus?.(200);
      return result;
    } catch (error: unknown) {
      transaction?.setHttpStatus?.(500);
      throw error;
    } finally {
      transaction?.end();
    }
  },
} as const;
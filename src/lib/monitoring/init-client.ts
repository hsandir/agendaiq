/**
 * Client-side Monitoring Initialization
 * This file should be imported in the root layout or _app.tsx
 */

import { initMonitoring, setMonitoringusers, addBreadcrumb } from './index';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Initialize monitoring for client-side
 * Should be called once at app startup
 */
export function initClientMonitoring() {
  if (typeof window === 'undefined') return;

  // Initialize with client-specific config
  initMonitoring({
    // Client-side specific overrides if needed
    tags: {
      runtime: 'browser',
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 100),
    },
  });

  // Add breadcrumb for page loads
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      addBreadcrumb({
        type: 'navigation',
        category: 'page.load',
        message: `Page loaded: ${window.location.pathname}`,
        level: 'info',
        timestamp: Date.now(),
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      addBreadcrumb({
        type: 'error',
        category: 'promise.rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        level: 'error',
        data: {
          reason: event.reason,
        },
        timestamp: Date.now(),
      });
    });

    // Monitor console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      addBreadcrumb({
        type: 'error',
        category: 'console.error',
        message: args[0]?.toString() || 'Console error',
        level: 'error',
        data: {
          arguments: args.slice(0, 3), // Limit to first 3 arguments
        },
        timestamp: Date.now(),
      });
      originalConsoleError.apply(console, args);
    };
  }
}

/**
 * React Hook for monitoring user context
 * Use this in your root component or auth provider
 */
export function useMonitoringUser() {
  const { data: session, __status  } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      // Set user context for monitoring
      setMonitoringUser({
        id: session.user.id as string,
        username: session.user.name ?? undefined,
        // Never send email directly
        tenant_id: session.user.staff?.school_id,
        role: session.user.staff?.role?.key,
        segment: session.user.staff?.role?.is_leadership ? 'vip' : 'standard',
      });

      // Add breadcrumb for login
      addBreadcrumb({
        type: 'user',
        category: 'auth',
        message: 'User authenticated',
        level: 'info',
        timestamp: Date.now(),
      });
    } else {
      // Clear user context on logout
      setMonitoringUser(null);

      // Add breadcrumb for logout
      addBreadcrumb({
        type: 'user',
        category: 'auth',
        message: 'User logged out',
        level: 'info',
        timestamp: Date.now(),
      });
    }
  }, [session, status]);
}

/**
 * React Component for client monitoring
 * Add this to your root layout
 */
export function ClientMonitoring() {
  useEffect(() => {
    initClientMonitoring();
  }, []);

  useMonitoringUser();

  return null;
}
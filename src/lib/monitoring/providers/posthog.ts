/**
 * PostHog Monitoring Provider
 * Implements the MonitoringProvider interface for PostHog
 */

import posthog from 'posthog-js';
import { PostHog } from 'posthog-node';
import { IMonitoringProvider } from '../types';
import { MonitoringConfig } from '../types';
import { captureException, trackEvent } from '@/lib/posthog/posthog-utils';

export class PostHogProvider implements IMonitoringProvider {
  private config: MonitoringConfig;
  private serverClient?: PostHog;
  
  constructor(config: MonitoringConfig) {
    this.config = config;
    
    // Initialize server-side client if needed
    if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      this.serverClient = new PostHog(
        process.env.NEXT_PUBLIC_POSTHOG_KEY,
        {
          host: 'https://us.i.posthog.com',
        }
      );
    }
  }
  
  async initialize(): Promise<void> {
    // PostHog is already initialized in instrumentation-client.ts
    console.log('PostHog monitoring provider initialized');
  }
  
  captureException(error: Error, context?: Record<string, any>): void {
    captureException(error, context);
    
    // Server-side capture
    if (this.serverClient) {
      this.serverClient.capture({
        distinctId: context?.userId || 'anonymous',
        event: '$exception',
        properties: {
          $exception_message: error.message,
          $exception_stack_trace_raw: error.stack,
          $exception_type: error.name,
          ...context,
        },
      });
    }
  }
  
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const eventName = `log_${level}`;
    trackEvent(eventName, {
      message,
      level,
      timestamp: new Date().toISOString(),
    });
    
    if (this.serverClient) {
      this.serverClient.capture({
        distinctId: 'system',
        event: eventName,
        properties: {
          message,
          level,
        },
      });
    }
  }
  
  setUser(user: { id: string; email?: string; [key: string]: any }): void {
    if (typeof window !== 'undefined' && posthog) {
      posthog.identify(user.id, {
        email: user.email,
        ...user,
      });
    }
  }
  
  clearUser(): void {
    if (typeof window !== 'undefined' && posthog) {
      posthog.reset();
    }
  }
  
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'debug' | 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }): void {
    trackEvent('breadcrumb', {
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    });
  }
  
  startTransaction(name: string, op: string): any {
    const startTime = Date.now();
    
    // Return a transaction-like object
    return {
      name,
      op,
      startTime,
      finish: () => {
        const duration = Date.now() - startTime;
        trackEvent('transaction', {
          name,
          operation: op,
          duration,
          timestamp: new Date().toISOString(),
        });
      },
      setTag: (key: string, value: string) => {
        // Tags can be added as properties
      },
      setData: (key: string, value: any) => {
        // Data can be added as properties
      },
    };
  }
  
  startSpan(name: string): any {
    const startTime = Date.now();
    
    return {
      name,
      startTime,
      finish: () => {
        const duration = Date.now() - startTime;
        trackEvent('span', {
          name,
          duration,
          timestamp: new Date().toISOString(),
        });
      },
    };
  }
  
  setTag(key: string, value: string): void {
    if (typeof window !== 'undefined' && posthog) {
      posthog.setPersonProperties({ [key]: value });
    }
  }
  
  setContext(key: string, context: Record<string, any>): void {
    if (typeof window !== 'undefined' && posthog) {
      posthog.setPersonProperties({ [key]: context });
    }
  }
  
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    trackEvent(eventName, properties);
    
    if (this.serverClient) {
      this.serverClient.capture({
        distinctId: properties?.userId || 'anonymous',
        event: eventName,
        properties,
      });
    }
  }
  
  async flush(): Promise<void> {
    if (this.serverClient) {
      await this.serverClient.shutdown();
    }
  }
  
  getStats(): {
    errors: number;
    warnings: number;
    transactions: number;
  } {
    // PostHog doesn't provide real-time stats like this
    // Return placeholder values
    return {
      errors: 0,
      warnings: 0,
      transactions: 0,
    };
  }
}

// Export a singleton instance
export const posthogProvider = new PostHogProvider(
  { provider: 'posthog', enabled: true } as MonitoringConfig
);
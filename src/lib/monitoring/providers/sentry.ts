/**
 * Sentry Monitoring Provider
 * Implements the MonitoringProvider interface for Sentry
 */

import * as Sentry from '@sentry/nextjs';
import type {
  MonitoringProvider,
  MonitoringConfig,
  UserContext,
  ErrorEvent,
  Breadcrumb,
  Transaction,
  CronJob,
} from '../types';

// Helper type for Sentry integration
type SentryIntegration = {
  name: string;
  new (options?: Record<string, unknown>): unknown;
};
import {
  IGNORE_ERRORS,
  DENY_URLS,
  ALLOW_URLS,
  removeSensitiveFields,
  getDynamicSampleRate,
} from '../config';

class SentryProvider implements MonitoringProvider {
  private initialized = false;
  private transactions = new Map<string, unknown>();

  init(config: MonitoringConfig): void {
    if (this.initialized) return;

    const sentryConfig: Record<string, unknown> = {
      dsn: config.enabled ? config.dsn : undefined,
      environment: config.environment,
      release: config.release,
      debug: config.debug,
      enabled: config.enabled,
      
      // Sample rates
      sampleRate: config.sampleRates?.error || 1.0,
      tracesSampleRate: config.sampleRates?.trace || 0,
      replaysOnErrorSampleRate: config.sampleRates?.replay || 0,
      replaysSessionSampleRate: config.sampleRates?.session || 0,
      profilesSampleRate: config.sampleRates?.profile || 0,
      
      // Error filtering
      ignoreErrors: IGNORE_ERRORS,
      denyUrls: DENY_URLS,
      allowUrls: ALLOW_URLS,
      
      // Dynamic sampling
      tracesSampler: (samplingContext: Record<string, unknown>) => {
        const request = samplingContext.request as { url?: string } | undefined;
        const user = samplingContext.user as { id?: string; segment?: string } | undefined;
        return getDynamicSampleRate({
          url: request?.url,
          error: !!samplingContext.error,
          userId: user?.id,
          isVIP: user?.segment === 'vip',
        });
      },
      
      // Before send hook for data sanitization
      beforeSend: (event: Record<string, unknown>, hint: Record<string, unknown>) => {
        // Allow custom beforeSend from config
        if (config.beforeSend) {
          const customEvent = config.beforeSend(this.sentryEventToErrorEvent(event));
          if (!customEvent) return null;
        }
        
        // Remove sensitive data
        const request = event.request as { headers?: Record<string, string>; query_string?: string } | undefined;
        if (request) {
          event.request = removeSensitiveFields(request);
          
          // Remove sensitive headers
          if (request.headers) {
            const headers = request.headers as Record<string, string>;
            delete headers['authorization'];
            delete headers['cookie'];
            delete headers['x-api-key'];
            delete headers['x-auth-token'];
          }
          
          // Clean query string
          if (request.query_string) {
            const params = new URLSearchParams(request.query_string);
            ['token', 'password', 'api_key', 'secret'].forEach(param => {
              if (params.has(param)) {
                params.set(param, '[REDACTED]');
              }
            });
            event.request = { ...request, query_string: params.toString() };
          }
        }
        
        // Remove sensitive extra data
        if (event.extra) {
          event.extra = removeSensitiveFields(event.extra);
        }
        
        // Remove sensitive user data
        const user = event.user as { email?: string } | undefined;
        if (user?.email) {
          delete user.email; // Never send email
        }
        
        return event;
      },
      
      // Before send transaction for performance data
      beforeSendTransaction: (transaction: Record<string, unknown>) => {
        // Add custom tags
        if (config.tags) {
          transaction.tags = { 
            ...(typeof transaction.tags === 'object' ? transaction.tags : {}), 
            ...config.tags 
          };
        }
        
        // Remove sensitive data from transaction
        if (transaction.request) {
          transaction.request = removeSensitiveFields(transaction.request);
        }
        
        return transaction;
      },
      
      // Integrations
      integrations: this.buildIntegrations(config),
      
      // Transport options
      transportOptions: {
        keepalive: true,
      },
      
      // Other options
      attachStacktrace: true,
      autoSessionTracking: config.environment === 'production',
      sendClientReports: config.environment === 'production',
      
      // Shutdown and flush timeouts
      shutdownTimeout: 2000,
    };

    // Initialize Sentry
    Sentry.init(sentryConfig);
    
    // Set initial tags
    if (config.tags) {
      Sentry.setTags(config.tags);
    }
    
    this.initialized = true;
  }

  private buildIntegrations(config: MonitoringConfig): Array<Record<string, unknown>> {
    const integrations: Array<Record<string, unknown>> = [];
    
    if (!config.integrations) return integrations;
    
    config.integrations.forEach(integration => {
      if (!integration.enabled) return;
      
      switch (integration.name) {
        case 'BrowserTracing':
          if (typeof window !== 'undefined') {
            // BrowserTracing is now browserTracingIntegration in newer versions
            const BrowserTracing = (Sentry as unknown as { BrowserTracing?: SentryIntegration; browserTracingIntegration?: SentryIntegration }).BrowserTracing || (Sentry as unknown as { BrowserTracing?: SentryIntegration; browserTracingIntegration?: SentryIntegration }).browserTracingIntegration;
            if (BrowserTracing) {
              integrations.push(
                new BrowserTracing(integration.options || {})
              );
            }
          }
          break;
          
        case 'Replay':
          if (typeof window !== 'undefined') {
            const Replay = (Sentry as unknown as { Replay?: SentryIntegration; replayIntegration?: SentryIntegration }).Replay || (Sentry as unknown as { Replay?: SentryIntegration; replayIntegration?: SentryIntegration }).replayIntegration;
            if (Replay) {
              integrations.push(
                new Replay(integration.options || {})
              );
            }
          }
          break;
          
        case 'ProfileIntegration':
          if (typeof window === 'undefined') {
            // Server-side profiling
            const ProfilingIntegration = (Sentry as unknown as { ProfilingIntegration?: SentryIntegration; profilingIntegration?: SentryIntegration }).ProfilingIntegration || (Sentry as unknown as { ProfilingIntegration?: SentryIntegration; profilingIntegration?: SentryIntegration }).profilingIntegration;
            if (ProfilingIntegration) {
              integrations.push(
                new ProfilingIntegration()
              );
            }
          }
          break;
      }
    });
    
    return integrations;
  }

  private sentryEventToErrorEvent(event: Record<string, unknown>): ErrorEvent {
    return {
      message: event.message as string | undefined,
      level: event.level as "error" | "info" | "debug" | "warning" | "fatal" | undefined,
      timestamp: event.timestamp as number | undefined,
      platform: event.platform as string | undefined,
      logger: event.logger as string | undefined,
      tags: event.tags as Record<string, string> | undefined,
      user: event.user as UserContext | undefined,
      request: event.request as Record<string, unknown> | undefined,
      contexts: event.contexts as Record<string, unknown> | undefined,
      extra: event.extra as Record<string, unknown> | undefined,
      fingerprint: event.fingerprint as string[] | undefined,
      exception: event.exception as Record<string, unknown> | undefined,
      breadcrumbs: event.breadcrumbs as Breadcrumb[] | undefined,
    };
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.initialized) return;
    
    const scope = new Sentry.Scope();
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        const sanitizedValue = removeSensitiveFields(value as Record<string, unknown>);
        scope.setContext(key, sanitizedValue as Record<string, unknown>);
      });
    }
    
    Sentry.captureException(error, scope);
  }

  captureMessage(message: string, level?: string, context?: Record<string, unknown>): void {
    if (!this.initialized) return;
    
    const scope = new Sentry.Scope();
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        const sanitizedValue = removeSensitiveFields(value as Record<string, unknown>);
        scope.setContext(key, sanitizedValue as Record<string, unknown>);
      });
    }
    
    const sentryLevel = this.mapLevel(level);
    Sentry.captureMessage(message, sentryLevel);
  }

  private mapLevel(level?: string): Sentry.SeverityLevel {
    switch (level) {
      case 'debug': return 'debug';
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'fatal': return 'fatal';
      default: return 'info';
    }
  }

  setUser(user: UserContext | null): void {
    if (!this.initialized) return;
    
    if (user === null) {
      Sentry.setUser(null);
      return;
    }
    
    // Never send email or other PII
    const safeUser: Record<string, unknown> = {
      id: user.id,
      username: user.username,
      tenant_id: user.tenant_id,
      role: user.role,
      segment: user.segment,
    };
    
    // Hash the user ID for privacy
    if (user.id) {
      safeUser.id = this.hashUserId(user.id);
    }
    
    Sentry.setUser(safeUser);
  }

  private hashUserId(userId: string): string {
    // Simple hash function for user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `user_${Math.abs(hash)}`;
  }

  setTags(tags: Record<string, string>): void {
    if (!this.initialized) return;
    Sentry.setTags(removeSensitiveFields(tags));
  }

  setTag(key: string, value: string): void {
    if (!this.initialized) return;
    Sentry.setTag(key, value);
  }

  setContext(key: string, context: Record<string, unknown>): void {
    if (!this.initialized) return;
    const sanitizedContext = removeSensitiveFields(context);
    Sentry.setContext(key, sanitizedContext as Record<string, unknown>);
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (!this.initialized) return;
    
    const sentryBreadcrumb: Sentry.Breadcrumb = {
      timestamp: breadcrumb.timestamp,
      type: breadcrumb.type,
      category: breadcrumb.category,
      message: breadcrumb.message,
      data: breadcrumb.data ? removeSensitiveFields(breadcrumb.data) : undefined,
      level: this.mapLevel(breadcrumb.level),
    };
    
    Sentry.addBreadcrumb(sentryBreadcrumb);
  }

  startTransaction(name: string, op?: string): Transaction {
    if (!this.initialized) {
      return {
        name,
        op,
        startTimestamp: Date.now(),
      };
    }
    
    const transaction = (Sentry as unknown as { startTransaction: (config: { name: string; op?: string }) => unknown }).startTransaction({
      name,
      op: op || 'custom',
    });
    
    const transactionObj: Transaction = {
      name,
      op,
      startTimestamp: Date.now(),
    };
    
    // Store Sentry transaction reference
    this.transactions.set(name, transaction);
    
    return transactionObj;
  }

  finishTransaction(transaction: Transaction): void {
    if (!this.initialized) return;
    
    const sentryTransaction = this.transactions.get(transaction.name);
    if (sentryTransaction && typeof sentryTransaction === 'object' && 'setStatus' in sentryTransaction) {
      if (transaction.status) {
        (sentryTransaction as { setStatus: (status: string) => void }).setStatus(transaction.status);
      }
      
      if (transaction.tags) {
        Object.entries(transaction.tags).forEach(([key, value]) => {
          if ('setTag' in sentryTransaction) {
            (sentryTransaction as { setTag: (key: string, value: string) => void }).setTag(key, value);
          }
        });
      }
      
      if (transaction.data) {
        Object.entries(transaction.data).forEach(([key, value]) => {
          if ('setData' in sentryTransaction) {
            (sentryTransaction as { setData: (key: string, value: unknown) => void }).setData(key, value);
          }
        });
      }
      
      if ('finish' in sentryTransaction) {
        (sentryTransaction as { finish: () => void }).finish();
      }
      this.transactions.delete(transaction.name);
    }
  }

  startProfiler(): void {
    // Profiling is automatic with profilesSampleRate
    // No manual start needed in Sentry
  }

  stopProfiler(): void {
    // Profiling is automatic with profilesSampleRate
    // No manual stop needed in Sentry
  }

  captureCheckIn(checkIn: CronJob): void {
    if (!this.initialized) return;
    
    const checkInData = {
      monitorSlug: checkIn.monitorSlug,
      status: checkIn.status,
      ...(checkIn.checkInId && { checkInId: checkIn.checkInId }),
      ...(checkIn.duration !== undefined && { duration: checkIn.duration }),
      ...(checkIn.environment && { environment: checkIn.environment }),
    };
    
    (Sentry as unknown as { captureCheckIn: (data: Record<string, unknown>) => void }).captureCheckIn(checkInData);
  }

  startReplay(): void {
    if (!this.initialized) return;
    
    const sentryWithHub = Sentry as unknown as { getCurrentHub?: () => { getIntegration?: (integration: unknown) => { start?: () => void } } };
    const currentHub = sentryWithHub.getCurrentHub?.();
    if (currentHub?.getIntegration) {
      const replay = currentHub.getIntegration((Sentry as unknown as { Replay?: unknown }).Replay);
      if (replay?.start) {
        replay.start();
      }
    }
  }

  stopReplay(): void {
    if (!this.initialized) return;
    
    const sentryWithHub = Sentry as unknown as { getCurrentHub?: () => { getIntegration?: (integration: unknown) => { stop?: () => void } } };
    const currentHub = sentryWithHub.getCurrentHub?.();
    if (currentHub?.getIntegration) {
      const replay = currentHub.getIntegration((Sentry as unknown as { Replay?: unknown }).Replay);
      if (replay?.stop) {
        replay.stop();
      }
    }
  }

  captureEvent(event: ErrorEvent): void {
    if (!this.initialized) return;
    
    const sentryEvent: Record<string, unknown> = {
      message: event.message,
      level: this.mapLevel(event.level),
      timestamp: event.timestamp,
      platform: event.platform,
      logger: event.logger,
      tags: event.tags,
      user: event.user,
      request: event.request ? removeSensitiveFields(event.request) : undefined,
      contexts: event.contexts,
      extra: event.extra ? removeSensitiveFields(event.extra) : undefined,
      fingerprint: event.fingerprint,
      exception: event.exception,
      breadcrumbs: event.breadcrumbs,
    };
    
    Sentry.captureEvent(sentryEvent);
  }

  async close(timeout?: number): Promise<boolean> {
    if (!this.initialized) return true;
    
    try {
      return await Sentry.close(timeout || 2000);
    } catch (error) {
      console.error('Error closing Sentry:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sentryProvider = new SentryProvider();
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
import {
  IGNORE_ERRORS,
  DENY_URLS,
  ALLOW_URLS,
  removeSensitiveFields,
  getDynamicSampleRate,
} from '../config';

class SentryProvider implements MonitoringProvider {
  private initialized = false;
  private transactions = new Map<string, any>();

  init(config: MonitoringConfig): void {
    if (this.initialized) return;

    const sentryConfig: any = {
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
      tracesSampler: (samplingContext: any) => {
        return getDynamicSampleRate({
          url: samplingContext.request?.url,
          error: !!samplingContext.error,
          userId: samplingContext.user?.id,
          isVIP: samplingContext.user?.segment === 'vip',
        });
      },
      
      // Before send hook for data sanitization
      beforeSend: (event: any, hint: any) => {
        // Allow custom beforeSend from config
        if (config.beforeSend) {
          const customEvent = config.beforeSend(this.sentryEventToErrorEvent(event));
          if (!customEvent) return null;
        }
        
        // Remove sensitive data
        if (event.request) {
          event.request = removeSensitiveFields(event.request);
          
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-api-key'];
            delete event.request.headers['x-auth-token'];
          }
          
          // Clean query string
          if (event.request.query_string) {
            const params = new URLSearchParams(event.request.query_string);
            ['token', 'password', 'api_key', 'secret'].forEach(param => {
              if (params.has(param)) {
                params.set(param, '[REDACTED]');
              }
            });
            event.request.query_string = params.toString();
          }
        }
        
        // Remove sensitive extra data
        if (event.extra) {
          event.extra = removeSensitiveFields(event.extra);
        }
        
        // Remove sensitive user data
        if (event.user?.email) {
          delete event.user.email; // Never send email
        }
        
        return event;
      },
      
      // Before send transaction for performance data
      beforeSendTransaction: (transaction: any) => {
        // Add custom tags
        if (config.tags) {
          transaction.tags = { ...transaction.tags, ...config.tags };
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

  private buildIntegrations(config: MonitoringConfig): any[] {
    const integrations: any[] = [];
    
    if (!config.integrations) return integrations;
    
    config.integrations.forEach(integration => {
      if (!integration.enabled) return;
      
      switch (integration.name) {
        case 'BrowserTracing':
          if (typeof window !== 'undefined') {
            // BrowserTracing is now browserTracingIntegration in newer versions
            const BrowserTracing = (Sentry as any).BrowserTracing || (Sentry as any).browserTracingIntegration;
            if (BrowserTracing) {
              integrations.push(
                new BrowserTracing(integration.options || {})
              );
            }
          }
          break;
          
        case 'Replay':
          if (typeof window !== 'undefined') {
            const Replay = (Sentry as any).Replay || (Sentry as any).replayIntegration;
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
            const ProfilingIntegration = (Sentry as any).ProfilingIntegration || (Sentry as any).profilingIntegration;
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

  private sentryEventToErrorEvent(event: any): ErrorEvent {
    return {
      message: event.message,
      level: event.level,
      timestamp: event.timestamp,
      platform: event.platform,
      logger: event.logger,
      tags: event.tags,
      user: event.user,
      request: event.request,
      contexts: event.contexts,
      extra: event.extra,
      fingerprint: event.fingerprint,
      exception: event.exception,
      breadcrumbs: event.breadcrumbs,
    };
  }

  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) return;
    
    const scope = new (Sentry as any).Scope();
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, removeSensitiveFields(value));
      });
    }
    
    Sentry.captureException(error, scope);
  }

  captureMessage(message: string, level?: string, context?: Record<string, any>): void {
    if (!this.initialized) return;
    
    const scope = new (Sentry as any).Scope();
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, removeSensitiveFields(value));
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
    const safeUser: any = {
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

  setContext(key: string, context: Record<string, any>): void {
    if (!this.initialized) return;
    Sentry.setContext(key, removeSensitiveFields(context));
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
    
    const transaction = (Sentry as any).startTransaction({
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
    if (sentryTransaction) {
      if (transaction.status) {
        sentryTransaction.setStatus(transaction.status);
      }
      
      if (transaction.tags) {
        Object.entries(transaction.tags).forEach(([key, value]) => {
          sentryTransaction.setTag(key, value);
        });
      }
      
      if (transaction.data) {
        Object.entries(transaction.data).forEach(([key, value]) => {
          sentryTransaction.setData(key, value);
        });
      }
      
      sentryTransaction.finish();
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
    
    Sentry.captureCheckIn({
      monitorSlug: checkIn.monitorSlug,
      status: checkIn.status,
      checkInId: checkIn.checkInId,
      duration: checkIn.duration,
      environment: checkIn.environment,
    });
  }

  startReplay(): void {
    if (!this.initialized) return;
    
    const replay = (Sentry as any).getCurrentHub?.()?.getIntegration?.((Sentry as any).Replay);
    if (replay) {
      replay.start();
    }
  }

  stopReplay(): void {
    if (!this.initialized) return;
    
    const replay = (Sentry as any).getCurrentHub?.()?.getIntegration?.((Sentry as any).Replay);
    if (replay) {
      replay.stop();
    }
  }

  captureEvent(event: ErrorEvent): void {
    if (!this.initialized) return;
    
    const sentryEvent: any = {
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
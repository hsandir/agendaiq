/**
 * Disabled Sentry Monitoring Provider
 * Provides no-op implementation when Sentry is disabled
 */

// Sentry disabled - subscription expired
import type {
  MonitoringProvider,
  MonitoringConfig,
  UserContext,
  ErrorEvent,
  Breadcrumb,
  Transaction,
  CronJob,
} from '../types';

class DisabledSentryProvider implements MonitoringProvider {
  private initialized = false;

  init(config: MonitoringConfig): void {
    console.log('Monitoring disabled - Sentry subscription expired');
    this.initialized = true;
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    console.error('Exception captured:', error.message, context);
  }

  captureMessage(message: string, level?: string, context?: Record<string, unknown>): void {
    console.log(`[${level || 'info'}] ${message}`, context);
  }

  setUser(user: UserContext | null): void {
    if (user) {
      console.log('User context set:', { id: user.id, role: (user as Record<string, unknown>).role });
    } else {
      console.log('User context cleared');
    }
  }

  setTags(tags: Record<string, string>): void {
    console.log('Tags set:', tags);
  }

  setTag(key: string, value: string): void {
    console.log(`Tag set: ${key} = ${value}`);
  }

  setContext(key: string, context: Record<string, unknown>): void {
    console.log(`Context set for ${key}:`, context);
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    console.log(`Breadcrumb: [${breadcrumb.category}] ${breadcrumb.message}`, breadcrumb.data);
  }

  startTransaction(name: string, op?: string): Transaction {
    console.log(`Transaction started: ${name}${op ? ` (${op})` : ''}`);
    return {
      name,
      op,
      startTimestamp: Date.now(),
    };
  }

  finishTransaction(transaction: Transaction): void {
    const duration = transaction.startTimestamp ? Date.now() - transaction.startTimestamp : 0;
    console.log(`Transaction finished: ${transaction.name} (${duration}ms)`);
  }

  startProfiler(): void {
    console.log('Profiler started (no-op)');
  }

  stopProfiler(): void {
    console.log('Profiler stopped (no-op)');
  }

  captureCheckIn(checkIn: CronJob): void {
    console.log('Cron check-in captured:', checkIn.monitorSlug, checkIn.status);
  }

  startReplay(): void {
    console.log('Replay started (no-op)');
  }

  stopReplay(): void {
    console.log('Replay stopped (no-op)');
  }

  captureEvent(event: ErrorEvent): void {
    console.log('Event captured:', event.message, event.level);
  }

  async close(timeout?: number): Promise<boolean> {
    console.log('Monitoring provider closed (no-op)');
    return true;
  }
}

// Export singleton instance
export const sentryProvider = new DisabledSentryProvider();
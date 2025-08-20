/**
 * Centralized Monitoring Manager
 * Single point of entry for all monitoring operations
 * Provider-agnostic interface for easy switching
 */

import type {
  MonitoringProvider,
  MonitoringConfig,
  UserContext,
  Breadcrumb,
  Transaction,
  CronJob,
  ErrorEvent,
} from './types';
import { MONITORING_CONFIG } from './config';
import { sentryProvider } from './providers/sentry';

class MonitoringManager {
  private provider: MonitoringProvider | null = null;
  private initialized = false;
  private config: MonitoringConfig = MONITORING_CONFIG;

  /**
   * Initialize the monitoring system
   * This should be called once at app startup
   */
  init(customConfig?: Partial<MonitoringConfig>): void {
    if (this.initialized) {
      console.warn('Monitoring already initialized');
      return;
    }

    // Merge custom config with default
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Select provider based on config
    switch (this.config.provider) {
      case 'sentry':
        this.provider = sentryProvider;
        break;
      case 'disabled':
        this.provider = sentryProvider; // Uses disabled implementation
        break;
      // Add more providers here as needed
      // case 'datadog':
      //   this.provider = datadogProvider;
      //   break;
      default:
        console.log(`Monitoring provider '${this.config.provider}' disabled or unknown`);
        this.provider = sentryProvider; // Fallback to disabled implementation
        break;
    }

    // Initialize the selected provider
    this.provider.init(this.config);
    this.initialized = true;

    // Log initialization
    if (this.config.debug) {
      console.log(`Monitoring initialized with ${this.config.provider}`, {
        environment: this.config.environment,
        release: this.config.release,
        enabled: this.config.enabled,
      });
    }
  }

  /**
   * Capture an exception/error
   */
  captureException(error: Error | unknown, context?: Record<string, unknown>): void {
    if (!this.provider || !this.config.enabled) return;

    // Convert unknown errors to Error objects
    const errorObj = error instanceof Error 
      ? error 
      : new Error(String(error));

    this.provider.captureException(errorObj, context);
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, unknown>
  ): void {
    if (!this.provider || !this.config.enabled) return;
    this.provider.captureMessage(message, level, context);
  }

  /**
   * Set user context
   */
  setUser(user: UserContext | null): void {
    if (!this.provider) return;
    this.provider.setUser(user);
  }

  /**
   * Set multiple tags at once
   */
  setTags(tags: Record<string, string>): void {
    if (!this.provider) return;
    this.provider.setTags(tags);
  }

  /**
   * Set a single tag
   */
  setTag(key: string, value: string): void {
    if (!this.provider) return;
    this.provider.setTag(key, value);
  }

  /**
   * Set custom context
   */
  setContext(key: string, context: Record<string, unknown>): void {
    if (!this.provider) return;
    this.provider.setContext(key, context);
  }

  /**
   * Add a breadcrumb (for error context)
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (!this.provider) return;
    this.provider.addBreadcrumb(breadcrumb);
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op?: string): Transaction {
    if (!this.provider) {
      return { name, op, startTimestamp: Date.now() };
    }
    return this.provider.startTransaction(name, op);
  }

  /**
   * Finish a performance transaction
   */
  finishTransaction(transaction: Transaction): void {
    if (!this.provider) return;
    this.provider.finishTransaction(transaction);
  }

  /**
   * Monitor a cron job
   */
  captureCheckIn(checkIn: CronJob): void {
    if (!this.provider?.captureCheckIn) return;
    this.provider.captureCheckIn(checkIn);
  }

  /**
   * Start session replay
   */
  startReplay(): void {
    if (!this.provider?.startReplay) return;
    this.provider.startReplay();
  }

  /**
   * Stop session replay
   */
  stopReplay(): void {
    if (!this.provider?.stopReplay) return;
    this.provider.stopReplay();
  }

  /**
   * Capture a custom event
   */
  captureEvent(event: ErrorEvent): void {
    if (!this.provider?.captureEvent) return;
    this.provider.captureEvent(event);
  }

  /**
   * Measure and report performance
   */
  measurePerformance(name: string, fn: () => void | Promise<void>): void | Promise<void> {
    const transaction = this.startTransaction(name, 'function');
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then((res) => {
            transaction.status = 'ok';
            return res;
          })
          .catch((error) => {
            transaction.status = 'internal_error';
            this.captureException(error);
            throw error;
          })
          .finally(() => {
            transaction.endTimestamp = Date.now();
            this.finishTransaction(transaction);
          });
      } else {
        transaction.status = 'ok';
        transaction.endTimestamp = Date.now();
        this.finishTransaction(transaction);
        return result;
      }
    } catch (error: unknown) {
      transaction.status = 'internal_error';
      transaction.endTimestamp = Date.now();
      this.finishTransaction(transaction);
      this.captureException(error);
      throw error;
    }
  }

  /**
   * Monitor an async function with automatic error capture
   */
  async withMonitoring<T>(
    name: string,
    fn: () => Promise<T>,
    options?: {
      op?: string;
      tags?: Record<string, string>;
      data?: Record<string, unknown>;
    }
  ): Promise<T> {
    const transaction = this.startTransaction(name, options?.op ?? 'function');
    
    if (options?.tags) {
      transaction.tags = options.tags;
    }
    
    if (options?.data) {
      transaction.data = options.data;
    }

    try {
      const result = await fn();
      transaction.status = 'ok';
      return result;
    } catch (error: unknown) {
      transaction.status = 'internal_error';
      this.captureException(error, {
        transaction: name,
        ...options?.data,
      });
      throw error;
    } finally {
      transaction.endTimestamp = Date.now();
      this.finishTransaction(transaction);
    }
  }

  /**
   * Helper to log and monitor API calls
   */
  async monitorAPICall<T>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.withMonitoring(
      `${method} ${endpoint}`,
      fn,
      {
        op: 'http.client',
        tags: {
          'http.method': method,
          'http.url': endpoint,
        },
      }
    );
  }

  /**
   * Helper to monitor database queries
   */
  async monitorDatabaseQuery<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.withMonitoring(
      `${operation} ${table}`,
      fn,
      {
        op: 'db',
        tags: {
          'db.operation': operation,
          'db.table': table,
        },
      }
    );
  }

  /**
   * Close and flush monitoring
   */
  async close(timeout?: number): Promise<boolean> {
    if (!this.provider?.close) return true;
    return this.provider.close(timeout);
  }

  /**
   * Check if monitoring is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): MonitoringConfig {
    return this.config;
  }

  /**
   * Update configuration (requires re-initialization)
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.initialized && this.provider) {
      // Re-initialize with new config
      this.initialized = false;
      this.provider = null;
      this.init();
    }
  }
}

// Create and export singleton instance
const monitoring = new MonitoringManager();

// Export convenience functions
export const { init: __initMonitoring,
  __captureException,
  __captureMessage,
  setUser: __setMonitoringUser,
  setTags: __setMonitoringTags,
  setTag: __setMonitoringTag,
  setContext: __setMonitoringContext,
  __addBreadcrumb,
  __startTransaction,
  __finishTransaction,
  __captureCheckIn,
  __startReplay,
  __stopReplay,
  __captureEvent,
  __measurePerformance,
  __withMonitoring,
  __monitorAPICall,
  __monitorDatabaseQuery,
  close: __closeMonitoring,
  isInitialized: __isMonitoringInitialized,
  getConfig: __getMonitoringConfig,
  updateConfig: __updateMonitoringConfig,
 } = monitoring;

// Export the instance for direct access if needed
export default monitoring;

// Export types for external use
export type {
  MonitoringConfig,
  UserContext,
  ErrorEvent,
  Breadcrumb,
  Transaction,
  CronJob,
  Alert,
  Performance,
} from './types';
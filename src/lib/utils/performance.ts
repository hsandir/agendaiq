// Performance monitoring utilities for AgendaIQ

import { Logger } from './logger';

interface PerformanceMetrics {
  route: string;
  method: string;
  duration: number;
  timestamp: string;
  userId?: number;
  status: number;
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

interface DatabaseQueryMetrics {
  query: string;
  duration: number;
  table?: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  rowCount?: number;
}

export class PerformanceMonitor {
  private static slowQueryThreshold = 1000; // 1 second
  private static slowRouteThreshold = 2000; // 2 seconds

  // Monitor API route performance
  static measureApiRoute<T>(
    route: string,
    method: string,
    handler: () => Promise<T>,
    userId?: number
  ): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    return handler();
      .then((result) => {
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();
        
        const metrics: PerformanceMetrics = {
          route,
          method,
          duration,
          timestamp: new Date().toISOString(),
          userId,
          status: 200,
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
          }
        };

        this.logPerformanceMetrics(metrics);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        
        const metrics: PerformanceMetrics = {
          route,
          method,
          duration,
          timestamp: new Date().toISOString(),
          userId,
          status: 500
        };

        this.logPerformanceMetrics(metrics, error);
        throw error;
      });
  }

  // Monitor database query performance
  static measureDatabaseQuery<T>(
    query: string,
    operation: DatabaseQueryMetrics['operation'],
    handler: () => Promise<T>,
    table?: string
  ): Promise<T> {
    const startTime = Date.now();

    return handler();
      .then((result) => {
        const duration = Date.now() - startTime;
        
        const metrics: DatabaseQueryMetrics = {
          query: this.sanitizeQuery(query),
          duration,
          table,
          operation,
          rowCount: Array.isArray(result) ? result.length : 1
        };

        this.logDatabaseMetrics(metrics);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        
        const metrics: DatabaseQueryMetrics = {
          query: this.sanitizeQuery(query),
          duration,
          table,
          operation
        };

        this.logDatabaseMetrics(metrics, error);
        throw error;
      });
  }

  // Log performance metrics
  private static logPerformanceMetrics(metrics: PerformanceMetrics, error?: unknown) {
    const logData = {
      ...metrics,
      ...(error ? { error: String(error) } : {})
    };

    if (metrics.duration > this.slowRouteThreshold) {
      Logger.warn(`Slow API route detected: ${metrics.route}`, logData, 'performance');
    } else {
      Logger.performance(`API ${metrics.method} ${metrics.route}`, metrics.duration, logData, 'api');
    }
  }

  // Log database metrics
  private static logDatabaseMetrics(metrics: DatabaseQueryMetrics, error?: unknown) {
    const logData = {
      ...metrics,
      ...(error ? { error: String(error) } : {})
    };

    if (metrics.duration > this.slowQueryThreshold) {
      Logger.warn(`Slow database query detected`, logData, 'database-performance');
    } else {
      Logger.database(`${metrics.operation} ${metrics.table ?? 'unknown'}`, metrics.table, metrics.duration, logData);
    }
  }

  // Sanitize query for logging (remove sensitive data)
  private static sanitizeQuery(query: string): string {
    return query
      .replace(/(['"][^'"]*@[^'"]*['"])/g, "'***@***.***'") // Email addresses
      .replace(/password\s*[=:]\s*['"][^'"]*['"]/gi, "password='***'") // Passwords
      .replace(/token\s*[=:]\s*['"][^'"]*['"]/gi, "token='***'") // Tokens
      .substring(0, 200); // Limit length
  }

  // Monitor memory usage
  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }

  // Check if memory usage is high
  static isMemoryUsageHigh(): boolean {
    const usage = this.getMemoryUsage();
    return usage.heapUsed > 512; // 512MB threshold
  }

  // Log system metrics periodically
  static startPeriodicMonitoring(intervalMs: number = 300000) { // 5 minutes
    setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      const cpuUsage = process.cpuUsage();
      
      Logger.info('System metrics snapshot', {
        memory: memoryUsage,
        cpu: cpuUsage,
        uptime: process.uptime(),
        pid: process.pid
      }, 'system-monitoring');

      if (this.isMemoryUsageHigh()) {
        Logger.warn('High memory usage detected', { memory: memoryUsage }, 'system-monitoring');
      }
    }, intervalMs);
  }
}

// Utility function for timing operations
export async function measureTime<T>(
  operation: string,
  handler: () => Promise<T>,
  context?: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await handler();
    const duration = Date.now() - startTime;
    
    Logger.performance(operation, duration, undefined, context);
    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    
    Logger.error(`${operation} failed`, { 
      error: String(error), 
      duration 
    }, context);
    
    throw error;
  }
}

// React hook for client-side performance monitoring
export function usePerformanceMonitor() {
  const measureClientOperation = (operation: string, handler: () => void) => {
    const startTime = performance.now();
    
    try {
      handler();
      const duration = performance.now() - startTime;
      
      // Only log if it's a slow operation
      if (duration > 100) {
        console.info(`Client operation: ${operation} took ${duration.toFixed(2)}ms`);
      }
    } catch (error: unknown) {
      const duration = performance.now() - startTime;
      console.error(`Client operation failed: ${operation}`, { error, duration });
      throw error;
    }
  };

  return { measureClientOperation };
}
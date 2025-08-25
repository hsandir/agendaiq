/**
 * Development/Admin Logger
 * High-level logging system for technical debugging and system monitoring
 */

import { 
  LogLevel, 
  DevLogCategory, 
  DevLogEntry, 
  LoggerConfig, 
  LogTransport,
  LogQuery,
  LogStats
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class DevLogger {
  private level: LogLevel;
  private transports: LogTransport[];
  private context: Record<string, unknown>;
  private enablePerformanceTracking: boolean;
  private performanceMarks: Map<string, number> = new Map();

  constructor(config: LoggerConfig) {
    this.level = config.level;
    this.transports = config.transports;
    this.context = config.context ?? {};
    this.enablePerformanceTracking = config.enablePerformanceTracking ?? false;
  }

  private async writeToTransports(entry: DevLogEntry): Promise<void> {
    const writePromises = this.transports.map(transport => {
      try {
        return transport.write(entry)
      } catch (error: unknown) {
        console.error(`Transport ${transport.name} failed:`, error);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(writePromises);
  }

  private createEntry(
    level: LogLevel,
    category: DevLogCategory,
    message: string,
    metadata?: Record<string, unknown>,
    context?: Record<string, unknown>
  ): DevLogEntry {
    // Get call stack information
    const stack = new Error().stack;
    const stackLines = stack?.split('\n') || [];
    const callerLine = stackLines[3]; // Skip Error, createEntry, and the log method
    
    let file: string | undefined;
    let line: number | undefined;
    let func: string | undefined;

    if (callerLine) {
      const match = callerLine.match(/at (.+) \((.+):(\d+):\d+\)/);
      if (match) {
        func = match[1];
        file = match[2];
        line = parseInt(match[3]);
      }
    }

    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata: { ...this.context, ...metadata },
      context,
      component: this.context.component,
      function: func,
      file,
      line,
      stack: level >= LogLevel.ERROR ? stack : undefined,
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development'
    };
  }

  // Performance tracking methods
  startPerformanceTimer(label: string): void {
    if (this.enablePerformanceTracking) {
      this.performanceMarks.set(label, performance.now());
    }
  }

  endPerformanceTimer(label: string): number | undefined {
    if (this.enablePerformanceTracking) {
      const startTime = this.performanceMarks.get(label);
      if (startTime) {
        const duration = performance.now() - startTime;
        this.performanceMarks.delete(label);
        return duration;
      }
    }
    return undefined;
  }

  // Log level methods
  async trace(category: DevLogCategory, message: string, metadata?: Record<string, unknown>, context?: Record<string, unknown>): Promise<void> {
    if (this.level <= LogLevel.TRACE) {
      const entry = this.createEntry(LogLevel.TRACE, category, message, metadata, context);
      await this.writeToTransports(entry);
    }
  }

  async debug(category: DevLogCategory, message: string, metadata?: Record<string, unknown>, context?: Record<string, unknown>): Promise<void> {
    if (this.level <= LogLevel.DEBUG) {
      const entry = this.createEntry(LogLevel.DEBUG, category, message, metadata, context);
      await this.writeToTransports(entry);
    }
  }

  async info(category: DevLogCategory, message: string, metadata?: Record<string, unknown>, context?: Record<string, unknown>): Promise<void> {
    if (this.level <= LogLevel.INFO) {
      const entry = this.createEntry(LogLevel.INFO, category, message, metadata, context);
      await this.writeToTransports(entry);
    }
  }

  async warn(category: DevLogCategory, message: string, metadata?: Record<string, unknown>, context?: Record<string, unknown>): Promise<void> {
    if (this.level <= LogLevel.WARN) {
      const entry = this.createEntry(LogLevel.WARN, category, message, metadata, context);
      await this.writeToTransports(entry);
    }
  }

  async error(category: DevLogCategory, message: string, error?: Error, metadata?: Record<string, unknown>, context?: Record<string, unknown>): Promise<void> {
    if (this.level <= LogLevel.ERROR) {
      const entry = this.createEntry(LogLevel.ERROR, category, message, {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      }, context);
      await this.writeToTransports(entry);
    }
  }

  async fatal(category: DevLogCategory, message: string, error?: Error, metadata?: Record<string, unknown>, context?: Record<string, unknown>): Promise<void> {
    const entry = this.createEntry(LogLevel.FATAL, category, message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }, context);
    await this.writeToTransports(entry);
  }

  // Specialized logging methods
  async logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    await this.writeToTransports(this.createEntry(
      level,
      DevLogCategory.API,
      `${method} ${path} - ${statusCode}`,
      metadata,
      {
        method,
        path,
        statusCode,
        duration,
        userId
      }
    ));
  }

  async logDatabaseQuery(
    query: string,
    duration: number,
    rowCount?: number,
    error?: Error
  ): Promise<void> {
    const level = error ? LogLevel.ERROR : duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;

    await this.writeToTransports(this.createEntry(
      level,
      DevLogCategory.DATABASE,
      error ? `Database query failed: ${error.message}` : `Database query completed in ${duration}ms`,
      {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration,
        rowCount,
        error: error ? {
          name: error.name,
          message: error.message
        } : undefined
      }
    ));
  }

  async logPerformanceMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;

    await this.writeToTransports(this.createEntry(
      level,
      DevLogCategory.PERFORMANCE,
      `${operation} completed in ${duration}ms`,
      metadata,
      {
        duration,
        performance: {
          duration,
          memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed : undefined
        }
      }
    ));
  }

  async logAuthEvent(
    event: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'permission_check',
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const level = event.includes('failure') ? LogLevel.WARN : LogLevel.INFO;

    await this.writeToTransports(this.createEntry(
      level,
      DevLogCategory.AUTH,
      `Authentication event: ${event}`,
      metadata,
      { userId }
    ));
  }

  // Query methods
  async query(query: LogQuery): Promise<DevLogEntry[]> {
    const results: DevLogEntry[] = [];

    for (const transport of this.transports) {
      if (transport.query) {
        try {
          const transportResults = await transport.query(query);
          results.push(...transportResults.filter(entry => 'category' in entry) as DevLogEntry[]);
        } catch (error: unknown) {
          console.error(`Transport ${transport.name} query failed:`, error);
        }
      }
    }

    // Remove duplicates based on ID
    const uniqueResults = results.filter((entry, index, self) => 
      index === self.findIndex(e => e.id === entry.id)
    );

    return uniqueResults;
  }

  async getStats(): Promise<LogStats> {
    const allStats: LogStats[] = [];

    for (const transport of this.transports) {
      if (transport.stats) {
        try {
          const stats = await transport.stats();
          allStats.push(stats);
        } catch (error: unknown) {
          console.error(`Transport ${transport.name} stats failed:`, error);
        }
      }
    }

    // Combine stats from all transports
    if (allStats.length === 0) {
      return {
        totalLogs: 0,
        logsByLevel: {
          [(LogLevel.TRACE)]: 0,
          [(LogLevel.DEBUG)]: 0,
          [(LogLevel.INFO)]: 0,
          [(LogLevel.WARN)]: 0,
          [(LogLevel.ERROR)]: 0,
          [(LogLevel.FATAL)]: 0
        },
        logsByCategory: {},
        timeRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        }
      };
    }

    const combinedStats: LogStats = {
      totalLogs: 0,
      logsByLevel: {
        [(LogLevel.TRACE)]: 0,
        [(LogLevel.DEBUG)]: 0,
        [(LogLevel.INFO)]: 0,
        [(LogLevel.WARN)]: 0,
        [(LogLevel.ERROR)]: 0,
        [(LogLevel.FATAL)]: 0
      },
      logsByCategory: {},
      timeRange: {
        start: allStats[0].timeRange.start,
        end: allStats[0].timeRange.end
      }
    };

    allStats.forEach(stats => {
      combinedStats.totalLogs += stats.totalLogs;
      
      Object.entries(stats.logsByLevel).forEach(([level, count]) => {
        combinedStats.logsByLevel[parseInt(level) as LogLevel] += count;
      });

      Object.entries(stats.logsByCategory).forEach(([category, count]) => {
        combinedStats.logsByCategory[category] = (combinedStats.logsByCategory[category] ?? 0) + count;
      });
    });

    return combinedStats;
  }

  // Child logger for components
  child(context: Record<string, unknown>): DevLogger {
    return new DevLogger({
      level: this.level,
      transports: this.transports,
      context: { ...this.context, ...context },
      enablePerformanceTracking: this.enablePerformanceTracking
    });
  }
}
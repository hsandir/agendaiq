// Professional structured logging system for AgendaIQ

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  timestamp: string;
  userId?: number;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  ipAddress?: string;
}

export interface LoggerConfig {
  enableDebug: boolean;
  enableConsole: boolean;
  enableFile: boolean;
  maxLogSize: number
}

export class Logger {
  private static config: LoggerConfig = {
    enableDebug: process.env.NODE_ENV === 'development',
    enableConsole: true,
    enableFile: false,
    maxLogSize: 1000000 // 1MB
  };

  static configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static debug(
    message: string, 
    data?: Record<string, unknown>, 
    context?: string,
    metadata?: Partial<LogEntry>
  ): void {
    if (this.config.enableDebug) {
      this.log(LogLevel.DEBUG, message, data, context, metadata);
    }
  }

  static info(
    message: string, 
    data?: Record<string, unknown>, 
    context?: string,
    metadata?: Partial<LogEntry>
  ): void {
    this.log(LogLevel.INFO, message, data, context, metadata);
  }

  static warn(
    message: string, 
    data?: Record<string, unknown>, 
    context?: string,
    metadata?: Partial<LogEntry>
  ): void {
    this.log(LogLevel.WARN, message, data, context, metadata);
  }

  static error(
    message: string, 
    data?: Record<string, unknown>, 
    context?: string,
    metadata?: Partial<LogEntry>
  ): void {
    this.log(LogLevel.ERROR, message, data, context, metadata);
  }

  // Specialized logging methods
  static audit(
    action: string,
    userId?: number,
    data?: Record<string, unknown>,
    context?: string
  ): void {
    this.info(`AUDIT: ${action}`, data, context, { userId });
  }

  static security(
    event: string,
    userId?: number,
    ipAddress?: string,
    data?: Record<string, unknown>
  ): void {
    this.warn(`SECURITY: ${event}`, data, 'security', { userId, ipAddress });
  }

  static performance(
    operation: string,
    duration: number,
    data?: Record<string, unknown>,
    context?: string
  ): void {
    this.info(`PERFORMANCE: ${operation}`, data, context, { duration });
  }

  static database(
    operation: string,
    table?: string,
    duration?: number,
    data?: Record<string, unknown>
  ): void {
    this.debug(`DATABASE: ${operation}`, { table, ...data }, 'database', { duration });
  }

  static api(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: number,
    data?: Record<string, unknown>
  ): void {
    const logData = {
      method,
      path,
      statusCode,
      ...data
    };
    
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API: ${method} ${path} ${statusCode}`, logData, 'api', { 
      userId, 
      duration 
    });
  }

  private static log(
    level: LogLevel, 
    message: string, 
    data?: Record<string, unknown>, 
    context?: string,
    metadata?: Partial<LogEntry>
  ): void {
    const logEntry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Future: Add file logging, external service logging
    // if (this.config.enableFile) {
    //   this.logToFile(logEntry);
    // }
  }

  private static logToConsole(entry: LogEntry): void {
    const formattedMessage = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  private static formatLogEntry(entry: LogEntry): string {
    const baseInfo = {
      timestamp: entry.timestamp,
      level: entry.level.toUpperCase(),
      message: entry.message
    };

    if (entry.context) {
      Object.assign(baseInfo, { context: entry.context });
    }

    const metadata: Record<string, unknown> = {};
    if (entry.userId) metadata.userId = entry.userId;
    if (entry.sessionId) metadata.sessionId = entry.sessionId;
    if (entry.requestId) metadata.requestId = entry.requestId;
    if (entry.duration) metadata.duration = `${entry.duration}ms`;
    if (entry.ipAddress) metadata.ipAddress = entry.ipAddress;

    const result = {
      ...baseInfo,
      ...(Object.keys(metadata).length > 0 && { metadata }),
      ...(entry.data && { data: entry.data })
    };

    return JSON.stringify(result, null, process.env.NODE_ENV === 'development' ? 2 : 0);
  }

  // Utility methods for common patterns
  static time<T>(operation: string, fn: () => T, context?: string): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.performance(operation, duration, undefined, context);
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - start;
      this.error(`${operation} failed`, { error: String(error), duration }, context);
      throw error;
    }
  }

  static async timeAsync<T>(operation: string, fn: () => Promise<T>, context?: string): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.performance(operation, duration, undefined, context);
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - start;
      this.error(`${operation} failed`, { error: String(error), duration }, context);
      throw error;
    }
  }
}
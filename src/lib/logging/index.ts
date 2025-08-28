/**
 * Professional Logging System
 * Main entry point for the dual-layer logging architecture
 */

import { DevLogger } from './dev-logger';
import { AuditLogger } from './audit-logger';
import { LogLevel, LoggerConfig, DevLogCategory } from './types';

// Transport imports
import { ConsoleTransport } from './transports/console-transport';
import { DatabaseTransport } from './transports/database-transport';
import { FileTransport } from './transports/file-transport';
import { RealtimeTransport } from './transports/realtime-transport';

/**
 * Development/Admin Logger Instance
 * For technical debugging, system monitoring, and performance analysis
 */
export const devLogger = new DevLogger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  transports: [
    new ConsoleTransport(LogLevel.DEBUG),
    new DatabaseTransport(LogLevel.INFO),
    new FileTransport(LogLevel.DEBUG),
    new RealtimeTransport(LogLevel.WARN, 'dev-monitoring')
  ],
  context: {
    service: 'AgendaIQ',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV ?? 'development'
  },
  enablePerformanceTracking: true
});

/**
 * Security/Audit Logger Instance  
 * For compliance, user tracking, and security monitoring
 */
export const auditLogger = new AuditLogger({
  transports: [
    new DatabaseTransport(LogLevel.TRACE), // Audit logs capture everything
    new FileTransport(LogLevel.TRACE),
    new RealtimeTransport(LogLevel.INFO, 'audit-monitoring')
  ],
  context: {
    service: 'AgendaIQ-Audit',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    compliance: {
      regulations: ['GDPR', 'SOX', 'FERPA'],
      retention: '7years'
    }
  }
});

/**
 * Create a child logger for specific components
 */
export function createDevLogger(component: string, metadata?: Record<string, unknown>) {
  return devLogger.child({
    component,
    ...metadata
  });
}

/**
 * Middleware logger for API requests
 */
export function createApiLogger(path: string) {
  return devLogger.child({
    component: 'API',
    path,
    type: 'middleware'
  });
}

/**
 * Database logger for query monitoring
 */
export function createDbLogger() {
  return devLogger.child({
    component: 'Database',
    type: 'query'
  });
}

/**
 * Authentication logger
 */
export function createAuthLogger() {
  return devLogger.child({
    component: 'Authentication',
    type: 'auth'
  });
}

// Re-export types and classes for direct usage
export * from './types';
export { DevLogger } from './dev-logger';
export { AuditLogger } from './audit-logger';

// Re-export transports
export { ConsoleTransport } from './transports/console-transport';
export { DatabaseTransport } from './transports/database-transport';
export { FileTransport } from './transports/file-transport';
export { RealtimeTransport } from './transports/realtime-transport';

/**
 * Initialize logging system
 * Call this early in application startup
 */
export async function initializeLogging() {
  // Log system startup
  await devLogger.info(
    DevLogCategory.SYSTEM,
    'Logging system initialized',
    {
      transports: devLogger['transports'].map(t => t.name),
      level: LogLevel[devLogger['level']],
      environment: process.env.NODE_ENV
    }
  );

  // Log audit system startup
  await auditLogger.logUserAction(
    {
      userId: 'system',
      email: 'system@agendaiq.com',
      role: 'system'
    },
    'initialize_logging_system',
    'success',
    {
      metadata: {
        transports: auditLogger['transports'].map(t => t.name),
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    }
  );
}

/**
 * Graceful shutdown of logging system
 */
export async function shutdownLogging() {
  await devLogger.info(
    DevLogCategory.SYSTEM,
    'Shutting down logging system'
  );
  
  // Allow transports to finish writing
  await new Promise(resolve => setTimeout(resolve, 1000));
}
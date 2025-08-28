/**
 * Database Transport for Persistent Logging
 * Stores logs in PostgreSQL database with full querying support
 */

import { LogTransport, LogLevel, BaseLogEntry, DevLogEntry, AuditLogEntry, LogQuery, LogStats } from '../types';
import { prisma } from '@/lib/prisma';

export class DatabaseTransport implements LogTransport {
  name = 'database';
  level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level
  }

  private mapLogLevelToPrisma(level: LogLevel) {
    switch (level) {
      case LogLevel.TRACE: return 'TRACE';
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      case LogLevel.FATAL: return 'FATAL';
      default: return 'INFO';
    }
  }

  private mapDevLogCategory(category: string) {
    switch (category.toLowerCase()) {
      case 'system': return 'system';
      case 'database': return 'database';
      case 'api': return 'api';
      case 'auth': return 'auth';
      case 'performance': return 'performance';
      case 'error': return 'error';
      case 'network': return 'network';
      case 'cache': return 'cache';
      case 'external': return 'external';
      case 'build': return 'build';
      default: return 'system';
    }
  }

  private mapAuditLogCategory(category: string) {
    switch (category.toLowerCase()) {
      case 'login_attempt': return 'login_attempt';
      case 'data_access': return 'data_access';
      case 'data_modification': return 'data_modification';
      case 'admin_action': return 'admin_action';
      case 'security_violation': return 'security_violation';
      case 'user_action': return 'user_action';
      case 'permission_check': return 'permission_check';
      case 'compliance': return 'compliance';
      case 'export': return 'export';
      case 'import': return 'import';
      default: return 'security_violation';
    }
  }

  private mapPrismaToLogLevel(prismaLevel: string): LogLevel {
    switch (prismaLevel) {
      case 'TRACE': return LogLevel.TRACE;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }

  private buildDevLogsWhere(query: LogQuery): object {
    return {
      ...(query.level && query.level.length > 0 && {
        level: { in: query.level.map(level => this.mapLogLevelToPrisma(level)) }
      }),
      ...((query.startDate || query.endDate) && {
        timestamp: {
          ...(query.startDate && { gte: query.startDate }),
          ...(query.endDate && { lte: query.endDate })
        }
      }),
      ...(query.userId && {
        user_id: Number(query.userId) || undefined
      }),
      ...(query.search && {
        message: { contains: query.search, mode: 'insensitive' }
      }),
      ...(query.category && {
        category: { in: query.category }
      })
    };
  }

  private buildSecurityLogsWhere(query: LogQuery): object {
    return {
      ...(query.level && query.level.length > 0 && {
        level: { in: query.level.map(level => this.mapLogLevelToPrisma(level)) }
      }),
      ...((query.startDate || query.endDate) && {
        timestamp: {
          ...(query.startDate && { gte: query.startDate }),
          ...(query.endDate && { lte: query.endDate })
        }
      }),
      ...(query.userId && {
        user_id: Number(query.userId) || undefined
      }),
      ...(query.search && {
        message: { contains: query.search, mode: 'insensitive' }
      }),
      ...(query.category && {
        category: { in: query.category }
      })
    };
  }

  async write(entry: BaseLogEntry): Promise<void> {
    if (entry.level < this.level) {
      return
    }

    try {
      // Determine if this is a development or audit log
      const isDev = 'category' in entry && typeof entry.category === 'string' && 
                   ['system', 'database', 'api', 'auth', 'performance', 'error', 'network', 'cache', 'external', 'build'].includes(entry.category);

      if (isDev) {
        await this.writeDevLog(entry as DevLogEntry);
      } else {
        await this.writeAuditLog(entry as AuditLogEntry);
      }
    } catch (error: unknown) {
      console.error('Failed to write log to database:', error);
      // Don't throw - logging should not break the application
    }
  }

  private async writeDevLog(entry: DevLogEntry): Promise<void> {
    await prisma.dev_logs.create({
      data: {
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        level: this.mapLogLevelToPrisma(entry.level),
        message: entry.message,
        category: this.mapDevLogCategory(entry.category),
        component: entry.component,
        function: entry.function,
        file: entry.file,
        line: entry.line,
        stack: entry.stack,
        environment: entry.environment,
        context: entry.context ? JSON.stringify(entry.context) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        performance: entry.performance ? JSON.stringify(entry.performance) : null,
        user_id: entry.context?.userId ? Number(entry.context.userId) || null : null,
        staff_id: entry.context?.staffId ? Number(entry.context.staffId) || null : null,
        session_id: entry.context?.sessionId,
        user_agent: entry.context?.userAgent,
        ip: entry.context?.ip,
        path: entry.context?.path,
        method: entry.context?.method,
        status_code: entry.context?.statusCode,
        duration: entry.context?.duration,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  private async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    await prisma.security_logs.create({
      data: {
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        level: this.mapLogLevelToPrisma(entry.level),
        message: entry.message,
        category: this.mapAuditLogCategory(entry.category),
        action: entry.action,
        result: entry.result,
        risk_level: entry.riskLevel,
        actor: JSON.stringify(entry.actor),
        target: entry.target ? JSON.stringify(entry.target) : null,
        context: entry.context ? JSON.stringify(entry.context) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        compliance: entry.compliance ? JSON.stringify(entry.compliance) : null,
        location: entry.location ? JSON.stringify(entry.location) : null,
        user_id: Number(entry.actor.userId) || 0,
        staff_id: entry.actor.staffId ? Number(entry.actor.staffId) || null : null,
        user_agent: entry.context?.userAgent,
        ip: entry.context?.ip,
        path: entry.context?.path,
        method: entry.context?.method,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  async query(query: LogQuery): Promise<BaseLogEntry[]> {
    const orderBy = {
      [query.orderBy ?? 'timestamp']: query.orderDirection ?? 'desc'
    };

    try {
      // Query both dev and audit logs with type-safe where builders
      const [devLogs, auditLogs] = await Promise.all([
        // Query development logs
        prisma.dev_logs.findMany({
          where: this.buildDevLogsWhere(query),
          orderBy,
          take: query.limit ?? 100,
          skip: query.offset ?? 0
        }),
        // Query audit logs  
        prisma.security_logs.findMany({
          where: this.buildSecurityLogsWhere(query),
          orderBy,
          take: query.limit ?? 100,
          skip: query.offset ?? 0
        })
      ]);

      // Convert to BaseLogEntry format
      const entries: BaseLogEntry[] = [
        ...devLogs.map(log => ({
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          level: this.mapPrismaToLogLevel(log.level),
          message: log.message,
          metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
          context: log.context ? JSON.parse(log.context) : undefined,
          category: log.category,
          component: log.component ?? undefined,
          function: log.function ?? undefined,
          file: log.file ?? undefined,
          line: log.line ?? undefined,
          stack: log.stack ?? undefined,
          environment: ['development', 'staging', 'production'].includes(log.environment) ? log.environment : 'development',
          performance: log.performance ? JSON.parse(log.performance) : undefined
        } satisfies DevLogEntry)),
        ...auditLogs.map(log => ({
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          level: this.mapPrismaToLogLevel(log.level),
          message: log.message,
          metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
          context: log.context ? JSON.parse(log.context) : undefined,
          category: log.category,
          action: log.action,
          result: log.result,
          risk_level: log.risk_level,
          actor: JSON.parse(log.actor),
          target: log.target ? JSON.parse(log.target) : undefined,
          compliance: log.compliance ? JSON.parse(log.compliance) : undefined,
          location: log.location ? JSON.parse(log.location) : undefined
        } satisfies AuditLogEntry))
      ];

      // Sort combined results by timestamp
      entries.sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return query.orderDirection === 'asc' ? aTime - bTime : bTime - aTime;
      });

      return entries.slice(0, query.limit ?? 100);
    } catch (error: unknown) {
      console.error('Failed to query logs from database:', error);
      return [];
    }
  }

  async stats(): Promise<LogStats> {
    try {
      const [devStats, auditStats] = await Promise.all([
        prisma.dev_logs.groupBy({
          by: ['level'],
          _count: { id: true },
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }),
        prisma.security_logs.groupBy({
          by: ['level'],
          _count: { id: true },
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);

      const logsByLevel: Record<LogLevel, number> = {
        [(LogLevel.TRACE)]: 0,
        [(LogLevel.DEBUG)]: 0,
        [(LogLevel.INFO)]: 0,
        [(LogLevel.WARN)]: 0,
        [(LogLevel.ERROR)]: 0,
        [(LogLevel.FATAL)]: 0
      };

      [...devStats, ...auditStats].forEach(stat => {
        logsByLevel[this.mapPrismaToLogLevel(stat.level)] += stat._count.id;
      });

      const totalLogs = Object.values(logsByLevel).reduce((sum, count) => sum + count, 0);

      return {
        totalLogs,
        logsByLevel,
        logsByCategory: {}, // TODO: Implement category stats
        timeRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      };
    } catch (error: unknown) {
      console.error('Failed to get log stats:', error);
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
          start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      };
    }
  }
}
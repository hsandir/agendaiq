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
    this.level = level;
  }

  async write(entry: BaseLogEntry): Promise<void> {
    if (entry.level < this.level) {
      return;
    }

    try {
      // Determine if this is a development or audit log
      const isDev = 'category' in entry && typeof (entry as any).category === 'string' && 
                   ['system', 'database', 'api', 'auth', 'performance', 'error', 'network', 'cache', 'external', 'build'].includes((entry as any).category);

      if (isDev) {
        await this.writeDevLog(entry as DevLogEntry);
      } else {
        await this.writeAuditLog(entry as AuditLogEntry);
      }
    } catch (error) {
      console.error('Failed to write log to database:', error);
      // Don't throw - logging should not break the application
    }
  }

  private async writeDevLog(entry: DevLogEntry): Promise<void> {
    await prisma.devLog.create({
      data: {
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        level: entry.level as any,
        message: entry.message,
        category: entry.category,
        component: entry.component,
        function: entry.function,
        file: entry.file,
        line: entry.line,
        stack: entry.stack,
        environment: entry.environment,
        context: entry.context ? JSON.stringify(entry.context) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        performance: entry.performance ? JSON.stringify(entry.performance) : null,
        userId: entry.context?.userId ? parseInt(entry.context.userId) : null,
        staffId: entry.context?.staffId ? parseInt(entry.context.staffId) : null,
        sessionId: entry.context?.sessionId,
        userAgent: entry.context?.userAgent,
        ip: entry.context?.ip,
        path: entry.context?.path,
        method: entry.context?.method,
        statusCode: entry.context?.statusCode,
        duration: entry.context?.duration
      }
    });
  }

  private async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    await prisma.securityLog.create({
      data: {
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        level: entry.level as any,
        message: entry.message,
        category: entry.category,
        action: entry.action,
        result: entry.result,
        riskLevel: entry.riskLevel,
        actor: JSON.stringify(entry.actor),
        target: entry.target ? JSON.stringify(entry.target) : null,
        context: entry.context ? JSON.stringify(entry.context) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        compliance: entry.compliance ? JSON.stringify(entry.compliance) : null,
        location: entry.location ? JSON.stringify(entry.location) : null,
        userId: parseInt(entry.actor.userId),
        staffId: entry.actor.staffId ? parseInt(entry.actor.staffId) : null,
        userAgent: entry.context?.userAgent,
        ip: entry.context?.ip,
        path: entry.context?.path,
        method: entry.context?.method
      }
    });
  }

  async query(query: LogQuery): Promise<BaseLogEntry[]> {
    const where: any = {};

    // Filter by level
    if (query.level && query.level.length > 0) {
      where.level = { in: query.level };
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }

    // Filter by user
    if (query.userId) {
      where.userId = query.userId;
    }

    // Search in message
    if (query.search) {
      wher(e instanceof Error ? e.message : String(e)) = { contains: query.search, mode: 'insensitive' };
    }

    const orderBy = {
      [query.orderBy || 'timestamp']: query.orderDirection || 'desc'
    };

    try {
      // Query both dev and audit logs
      const [devLogs, auditLogs] = await Promise.all([
        // Query development logs
        prisma.devLog.findMany({
          where: {
            ...where,
            ...(query.category ? { category: { in: query.category } } : {})
          },
          orderBy,
          take: query.limit || 100,
          skip: query.offset || 0
        }),
        // Query audit logs
        prisma.securityLog.findMany({
          where: {
            ...where,
            ...(query.category ? { category: { in: query.category } } : {})
          },
          orderBy,
          take: query.limit || 100,
          skip: query.offset || 0
        })
      ]);

      // Convert to BaseLogEntry format
      const entries: BaseLogEntry[] = [
        ...devLogs.map(log => ({
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          level: log.level as unknown as LogLevel,
          message: log.message,
          metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
          context: log.context ? JSON.parse(log.context) : undefined,
          category: log.category,
          component: log.component,
          function: log.function,
          file: log.file,
          line: log.line,
          stack: log.stack,
          environment: log.environment,
          performance: log.performance ? JSON.parse(log.performance) : undefined
        } as DevLogEntry)),
        ...auditLogs.map(log => ({
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          level: log.level as unknown as LogLevel,
          message: log.message,
          metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
          context: log.context ? JSON.parse(log.context) : undefined,
          category: log.category,
          action: log.action,
          result: log.result,
          riskLevel: log.riskLevel,
          actor: JSON.parse(log.actor),
          target: log.target ? JSON.parse(log.target) : undefined,
          compliance: log.compliance ? JSON.parse(log.compliance) : undefined,
          location: log.location ? JSON.parse(log.location) : undefined
        } as AuditLogEntry))
      ];

      // Sort combined results by timestamp
      entries.sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return query.orderDirection === 'asc' ? aTime - bTime : bTime - aTime;
      });

      return entries.slice(0, query.limit || 100);
    } catch (error) {
      console.error('Failed to query logs from database:', error);
      return [];
    }
  }

  async stats(): Promise<LogStats> {
    try {
      const [devStats, auditStats] = await Promise.all([
        prisma.devLog.groupBy({
          by: ['level'],
          _count: { id: true },
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }),
        prisma.securityLog.groupBy({
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
        [LogLevel.TRACE]: 0,
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.FATAL]: 0
      };

      [...devStats, ...auditStats].forEach(stat => {
        logsByLevel[stat.level as unknown as LogLevel] += stat._count.id;
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
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return {
        totalLogs: 0,
        logsByLevel: {
          [LogLevel.TRACE]: 0,
          [LogLevel.DEBUG]: 0,
          [LogLevel.INFO]: 0,
          [LogLevel.WARN]: 0,
          [LogLevel.ERROR]: 0,
          [LogLevel.FATAL]: 0
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
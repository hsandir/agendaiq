import { prisma } from '@/lib/prisma';
import { AuditCategory } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';

// Types for different audit events
export interface CriticalAuditEvent {
  category: AuditCategory;
  action: string;
  userId?: number;
  staffId?: number;
  targetUserId?: number;
  targetStaffId?: number;
  ipAddress?: string;
  sessionId?: string;
  success?: boolean;
  errorMessage?: string;
  riskScore?: number;
  metadata?: Record<string, any>;
}

export interface OperationalEvent {
  timestamp?: Date;
  userId?: number;
  staffId?: number;
  action: string;
  path?: string;
  method?: string;
  duration?: number;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface AuditEventContext {
  request?: NextRequest;
  userId?: number;
  staffId?: number;
  sessionId?: string;
}

class HybridAuditSystem {
  private logDir = path.join(process.cwd(), 'logs');
  private isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  /**
   * Extract context from request
   */
  private extractRequestContext(request?: NextRequest): Partial<CriticalAuditEvent> {
    if (!request) return {};

    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown';
    
    return {
      ipAddress,
      metadata: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        method: request.method,
        url: request.url
      }
    };
  }

  /**
   * Calculate risk score based on event characteristics
   */
  private calculateRiskScore(event: CriticalAuditEvent): number {
    let score = 0;

    // Base scores by category
    switch (event.category) {
      case 'SECURITY': score += 30; break;
      case 'DATA_CRITICAL': score += 25; break;
      case 'PERMISSION': score += 20; break;
      case 'AUTH': score += 15; break;
      case 'SYSTEM': score += 10; break;
    }

    // Failed operations are more risky
    if (event.success === false) score += 20;

    // Admin operations on other users are risky
    if (event.targetUserId && event.targetUserId !== event.userId) score += 15;

    // Unknown IP addresses are suspicious
    if (!event.ipAddress || event.ipAddress === 'unknown') score += 10;

    // Error messages indicate problems
    if (event.errorMessage) score += 10;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Log critical events to database
   */
  async logCritical(event: CriticalAuditEvent, context?: AuditEventContext): Promise<void> {
    try {
      // Merge context data
      const requestContext = this.extractRequestContext(context?.request);
      const mergedEvent = {
        ...event,
        ...requestContext,
        userId: event.userId || context?.userId,
        staffId: event.staffId || context?.staffId,
        sessionId: event.sessionId || context?.sessionId,
        success: event.success ?? true
      };

      // Calculate risk score
      mergedEvent.riskScore = event.riskScore ?? this.calculateRiskScore(mergedEvent);

      // Store in database
      await prisma.criticalAuditLog.create({
        data: {
          timestamp: new Date(),
          category: mergedEvent.category,
          action: mergedEvent.action,
          user_id: mergedEvent.userId,
          staff_id: mergedEvent.staffId,
          target_user_id: mergedEvent.targetUserId,
          target_staff_id: mergedEvent.targetStaffId,
          ip_address: mergedEvent.ipAddress,
          session_id: mergedEvent.sessionId,
          risk_score: mergedEvent.riskScore,
          success: mergedEvent.success,
          error_message: mergedEvent.errorMessage,
          metadata: mergedEvent.metadata ? JSON.parse(JSON.stringify(mergedEvent.metadata)) : undefined
        }
      });

      // High risk events also go to operational logs for additional tracking
      if (mergedEvent.riskScore >= 50) {
        await this.logOperational({
          action: `HIGH_RISK_${mergedEvent.action}`,
          userId: mergedEvent.userId,
          staffId: mergedEvent.staffId,
          ipAddress: mergedEvent.ipAddress,
          metadata: {
            ...mergedEvent.metadata,
            riskScore: mergedEvent.riskScore,
            category: mergedEvent.category
          }
        });
      }

    } catch (error) {
      console.error('Critical audit logging failed:', error);
      // Fallback to operational logging
      await this.logOperational({
        action: 'AUDIT_LOG_FAILURE',
        metadata: { 
          originalEvent: event,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Log operational events to files
   */
  async logOperational(event: OperationalEvent): Promise<void> {
    try {
      const timestamp = event.timestamp || new Date();
      const logEntry = {
        timestamp: timestamp.toISOString(),
        userId: event.userId,
        staffId: event.staffId,
        action: event.action,
        path: event.path,
        method: event.method,
        duration: event.duration,
        userAgent: event.userAgent,
        ipAddress: event.ipAddress,
        metadata: event.metadata
      };

      // Create daily log file path
      const dateStr = timestamp.toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `operational-${dateStr}.jsonl`);

      // Append to file (JSON Lines format)
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine, 'utf8');

    } catch (error) {
      console.error('Operational logging failed:', error);
      // Last resort: console log
      if (!this.isProduction) {
        console.log('OPERATIONAL_LOG:', event);
      }
    }
  }

  /**
   * Smart routing: automatically choose critical vs operational based on event
   */
  async log(event: CriticalAuditEvent | OperationalEvent, context?: AuditEventContext): Promise<void> {
    // If event has category, it's critical
    if ('category' in event) {
      await this.logCritical(event as CriticalAuditEvent, context);
    } else {
      await this.logOperational(event as OperationalEvent);
    }
  }

  /**
   * Convenience methods for common audit events
   */
  async logAuth(action: string, userId?: number, staffId?: number, success: boolean = true, context?: AuditEventContext): Promise<void> {
    await this.logCritical({
      category: 'AUTH',
      action,
      userId,
      staffId,
      success,
      riskScore: success ? 5 : 25
    }, context);
  }

  async logSecurity(action: string, userId?: number, staffId?: number, errorMessage?: string, context?: AuditEventContext): Promise<void> {
    await this.logCritical({
      category: 'SECURITY',
      action,
      userId,
      staffId,
      success: !errorMessage,
      errorMessage,
      riskScore: 40
    }, context);
  }

  async logDataCritical(action: string, userId?: number, staffId?: number, targetUserId?: number, metadata?: Record<string, any>, context?: AuditEventContext): Promise<void> {
    await this.logCritical({
      category: 'DATA_CRITICAL',
      action,
      userId,
      staffId,
      targetUserId,
      metadata,
      riskScore: 35
    }, context);
  }

  async logPermission(action: string, userId?: number, staffId?: number, targetUserId?: number, targetStaffId?: number, context?: AuditEventContext): Promise<void> {
    await this.logCritical({
      category: 'PERMISSION',
      action,
      userId,
      staffId,
      targetUserId,
      targetStaffId,
      riskScore: 30
    }, context);
  }

  async logPageVisit(path: string, userId?: number, staffId?: number, duration?: number, context?: AuditEventContext): Promise<void> {
    const requestContext = this.extractRequestContext(context?.request);
    await this.logOperational({
      action: 'page_visit',
      path,
      userId,
      staffId,
      duration,
      userAgent: requestContext.metadata?.userAgent as string,
      ipAddress: requestContext.ipAddress,
      method: requestContext.metadata?.method as string
    });
  }

  async logApiCall(path: string, method: string, duration: number, userId?: number, staffId?: number, context?: AuditEventContext): Promise<void> {
    const requestContext = this.extractRequestContext(context?.request);
    await this.logOperational({
      action: 'api_call',
      path,
      method,
      duration,
      userId,
      staffId,
      userAgent: requestContext.metadata?.userAgent as string,
      ipAddress: requestContext.ipAddress
    });
  }

  /**
   * Get recent critical events (for admin dashboard)
   */
  async getRecentCriticalEvents(limit: number = 50, category?: AuditCategory, userId?: number): Promise<any[]> {
    return await prisma.criticalAuditLog.findMany({
      where: {
        ...(category && { category }),
        ...(userId && { user_id: userId })
      },
      include: {
        User: {
          select: { id: true, email: true, name: true }
        },
        Staff: {
          select: { id: true, Role: { select: { title: true } } }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });
  }

  /**
   * Get high risk events (for security monitoring)
   */
  async getHighRiskEvents(minRiskScore: number = 50, hoursBack: number = 24): Promise<any[]> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    return await prisma.criticalAuditLog.findMany({
      where: {
        risk_score: { gte: minRiskScore },
        timestamp: { gte: since }
      },
      include: {
        User: {
          select: { id: true, email: true, name: true }
        },
        Staff: {
          select: { id: true, Role: { select: { title: true } } }
        }
      },
      orderBy: {
        risk_score: 'desc'
      }
    });
  }

  /**
   * Cleanup old logs (for maintenance)
   */
  async cleanup(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    // Clean database logs
    await prisma.criticalAuditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate }
      }
    });

    // Clean file logs
    try {
      const files = await fs.readdir(this.logDir);
      for (const file of files) {
        if (file.startsWith('operational-') && file.endsWith('.jsonl')) {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      console.error('File cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const auditSystem = new HybridAuditSystem();

// Export convenience functions
export const logAuth = auditSystem.logAuth.bind(auditSystem);
export const logSecurity = auditSystem.logSecurity.bind(auditSystem);
export const logDataCritical = auditSystem.logDataCritical.bind(auditSystem);
export const logPermission = auditSystem.logPermission.bind(auditSystem);
export const logPageVisit = auditSystem.logPageVisit.bind(auditSystem);
export const logApiCall = auditSystem.logApiCall.bind(auditSystem);
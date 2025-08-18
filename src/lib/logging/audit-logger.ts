/**
 * Security/Audit Logger
 * Specialized logging for security, compliance, and user tracking
 */

import { 
  LogLevel, 
  AuditLogCategory, 
  AuditLogEntry, 
  LoggerConfig, 
  LogTransport,
  LogQuery
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class AuditLogger {
  private transports: LogTransport[];
  private context: Record<string, any>;

  constructor(config: Omit<LoggerConfig, 'level'>) {
    // Audit logs always capture everything (TRACE level)
    this.transports = config.transports;
    this.context = config.context || {};
  }

  private async writeToTransports(entry: AuditLogEntry): Promise<void> {
    const writePromises = (this.transports.map(transport => {
      try {
        return transport.write(entry));
      } catch (error: unknown) {
        console.error(`Audit transport ${transport.name} failed:`, error);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(writePromises);
  }

  private createEntry(
    category: AuditLogCategory,
    action: string,
    actor: AuditLogEntry['actor'],
    result: 'success' | 'failure' | 'blocked',
    message: string,
    options?: {
      level?: LogLevel;
      target?: AuditLogEntry['target'];
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
      metadata?: Record<string, any>;
      context?: Record<string, any>;
      compliance?: AuditLogEntry['compliance'];
      location?: AuditLogEntry['location'];
    }
  ): AuditLogEntry {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level: options?.level || LogLevel.INFO,
      category,
      action,
      actor,
      target: options?.target,
      result,
      riskLevel: options?.riskLevel || this.calculateRiskLevel(category, action, result),
      message,
      metadata: { ...this.context, ...options?.metadata },
      context: options?.context,
      compliance: options?.compliance,
      location: options?.location
    };
  }

  private calculateRiskLevel(
    category: AuditLogCategory,
    action: string,
    result: 'success' | 'failure' | 'blocked'
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Blocked actions are always high risk
    if (result === 'blocked') return 'high';

    // Critical categories
    if ([
      AuditLogCategory.SECURITY_VIOLATION,
      AuditLogCategory.ADMIN_ACTION
    ].includes(category)) {
      return result === 'failure' ? 'critical' : 'high';
    }

    // High-risk actions
    const highRiskActions = [
      'delete', 'export', 'import', 'grant_permission', 'revoke_permission',
      'escalate_privilege', 'access_sensitive_data', 'modify_system_settings'
    ];
    if (highRiskActions.some(riskAction => action.includes(riskAction))) {
      return result === 'failure' ? 'high' : 'medium';
    }

    // Failed authentications are medium risk
    if (category === AuditLogCategory.LOGIN_ATTEMPT && result === 'failure') {
      return 'medium';
    }

    // Default to low risk
    return 'low';
  }

  // User action logging
  async logUserAction(
    actor: AuditLogEntry['actor'],
    action: string,
    result: 'success' | 'failure' | 'blocked',
    options?: {
      target?: AuditLogEntry['target'];
      metadata?: Record<string, any>;
      context?: Record<string, any>;
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<void> {
    const entry = this.createEntry(
      AuditLogCategory.USER_ACTION,
      action,
      actor,
      result,
      `User ${actor.email} attempted to ${action}: ${result}`,
      options
    );

    await this.writeToTransports(entry);
  }

  // Login attempt logging
  async logLoginAttempt(
    email: string,
    result: 'success' | 'failure' | 'blocked',
    options?: {
      userId?: string;
      staffId?: string;
      role?: string;
      department?: string;
      reason?: string;
      context?: Record<string, any>;
      location?: AuditLogEntry['location'];
    }
  ): Promise<void> {
    const entry = this.createEntry(
      AuditLogCategory.LOGIN_ATTEMPT,
      'login',
      {
        userId: options?.userId || 'unknown',
        staffId: options?.staffId,
        email,
        role: options?.role,
        department: options?.department
      },
      result,
      `Login attempt for ${email}: ${result}${options?.reason ? ` (${options.reason})` : ''}`,
      {
        level: result === 'failure' ? LogLevel.WARN : LogLevel.INFO,
        metadata: options?.reason ? { reason: options.reason } : undefined,
        context: options?.context,
        location: options?.location,
        riskLevel: result === 'failure' ? 'medium' : 'low'
      }
    );

    await this.writeToTransports(entry);
  }

  // Permission check logging
  async logPermissionCheck(
    actor: AuditLogEntry['actor'],
    permission: string,
    target: AuditLogEntry['target'],
    result: 'success' | 'failure' | 'blocked',
    context?: Record<string, any>
  ): Promise<void> {
    const entry = this.createEntry(
      AuditLogCategory.PERMISSION_CHECK,
      `check_permission_${permission}`,
      actor,
      result,
      `Permission check for ${permission} on ${target?.type}:${target?.id}: ${result}`,
      {
        level: result === 'blocked' ? LogLevel.WARN : LogLevel.DEBUG,
        target,
        context,
        riskLevel: result === 'blocked' ? 'medium' : 'low'
      }
    );

    await this.writeToTransports(entry);
  }

  // Data access logging
  async logDataAccess(
    actor: AuditLogEntry['actor'],
    target: AuditLogEntry['target'],
    action: 'read' | 'list' | 'search' | 'export',
    result: 'success' | 'failure' | 'blocked',
    options?: {
      recordCount?: number;
      query?: string;
      filters?: Record<string, any>;
      context?: Record<string, any>;
      compliance?: AuditLogEntry['compliance'];
    }
  ): Promise<void> {
    const entry = this.createEntry(
      AuditLogCategory.DATA_ACCESS,
      `${action}_${target?.type || 'unknown'}`,
      actor,
      result,
      `Data access: ${action} ${target?.type || 'unknown'}${options?.recordCount ? ` (${options.recordCount} records)` : ''}: ${result}`,
      {
        level: result === 'blocked' ? LogLevel.WARN : LogLevel.INFO,
        target,
        metadata: {
          recordCount: options?.recordCount,
          query: options?.query,
          filters: options?.filters
        },
        context: options?.context,
        compliance: options?.compliance,
        riskLevel: action === 'export' ? 'medium' : 'low'
      }
    );

    await this.writeToTransports(entry);
  }

  // Data modification logging
  async logDataModification(
    actor: AuditLogEntry['actor'],
    target: AuditLogEntry['target'],
    action: 'create' | 'update' | 'delete' | 'import',
    result: 'success' | 'failure' | 'blocked',
    options?: {
      changes?: Record<string, { old?: Record<string, unknown>; new?: Record<string, unknown> }>;
      recordCount?: number;
      context?: Record<string, any>;
      compliance?: AuditLogEntry['compliance'];
    }
  ): Promise<void> {
    const entry = this.createEntry(
      AuditLogCategory.DATA_MODIFICATION,
      `${action}_${target?.type || 'unknown'}`,
      actor,
      result,
      `Data modification: ${action} ${target?.type || 'unknown'}${target?.name ? ` "${target.name}"` : ''}: ${result}`,
      {
        level: result === 'blocked' ? LogLevel.WARN : LogLevel.INFO,
        target,
        metadata: {
          changes: options?.changes,
          recordCount: options?.recordCount
        },
        context: options?.context,
        compliance: options?.compliance,
        riskLevel: action === 'delete' ? 'high' : 'medium'
      }
    );

    await this.writeToTransports(entry);
  }

  // Admin action logging
  async logAdminAction(
    actor: AuditLogEntry['actor'],
    action: string,
    target: AuditLogEntry['target'],
    result: 'success' | 'failure' | 'blocked',
    options?: {
      metadata?: Record<string, any>;
      context?: Record<string, any>;
      compliance?: AuditLogEntry['compliance'];
    }
  ): Promise<void> {
    const entry = this.createEntry(
      AuditLogCategory.ADMIN_ACTION,
      action,
      actor,
      result,
      `Admin action: ${action} on ${target?.type}:${target?.id}: ${result}`,
      {
        level: result === 'failure' ? LogLevel.ERROR : LogLevel.WARN,
        target,
        metadata: options?.metadata,
        context: options?.context,
        compliance: options?.compliance,
        riskLevel: 'high'
      }
    );

    await this.writeToTransports(entry);
  }

  // Security violation logging
  async logSecurityViolation(
    actor: AuditLogEntry['actor'],
    violation: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    options?: {
      target?: AuditLogEntry['target'];
      metadata?: Record<string, any>;
      context?: Record<string, any>;
      location?: AuditLogEntry['location'];
    }
  ): Promise<void> {
    const entry = this.createEntry(
      AuditLogCategory.SECURITY_VIOLATION,
      violation,
      actor,
      'blocked',
      `Security violation: ${violation}`,
      {
        level: severity === 'critical' ? LogLevel.FATAL : 
               severity === 'high' ? LogLevel.ERROR : 
               severity === 'medium' ? LogLevel.WARN : LogLevel.INFO,
        target: options?.target,
        metadata: options?.metadata,
        context: options?.context,
        location: options?.location,
        riskLevel: severity
      }
    );

    await this.writeToTransports(entry);
  }

  // Compliance logging
  async logComplianceEvent(
    actor: AuditLogEntry['actor'],
    event: string,
    regulation: string[],
    dataClassification: string,
    options?: {
      target?: AuditLogEntry['target'];
      metadata?: Record<string, any>;
      context?: Record<string, any>;
      retention?: string;
    }
  ): Promise<void> {
    const entry = this.createEntry(
      AuditLogCategory.COMPLIANCE,
      event,
      actor,
      'success',
      `Compliance event: ${event} (${regulation.join(', ')})`,
      {
        level: LogLevel.INFO,
        target: options?.target,
        metadata: options?.metadata,
        context: options?.context,
        compliance: {
          regulation,
          dataClassification,
          retention: options?.retention || '7years'
        },
        riskLevel: 'medium'
      }
    );

    await this.writeToTransports(entry);
  }

  // Query methods
  async query(query: LogQuery): Promise<AuditLogEntry[]> {
    const results: AuditLogEntry[] = [];

    for (const transport of this.transports) {
      if (transport.query) {
        try {
          const transportResults = await transport.query(query);
          results.push(...transportResults.filter(entry => 'actor' in entry) as AuditLogEntry[]);
        } catch (error: unknown) {
          console.error(`Audit transport ${transport.name} query failed:`, error);
        }
      }
    }

    // Remove duplicates based on ID
    const uniqueResults = results.filter((entry, index, self) => 
      index === self.findIndex(e => e.id === entry.id)
    );

    return uniqueResults;
  }

  // Get security metrics
  async getSecurityMetrics(): Promise<{
    totalViolations: number;
    violationsByRisk: Record<string, number>;
    failedLogins: number;
    blockedActions: number;
    timeRange: { start: string; end: string };
  }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const violations = await this.query{
      category: [((AuditLogCategory.SECURITY_VIOLATION)],
      startDate: oneDayAgo
    });

    const failedLogins = await this.query{
      category: [((AuditLogCategory.LOGIN_ATTEMPT)],
      startDate: oneDayAgo
    });

    const blockedActions = await this.query({
      startDate: oneDayAgo
    });

    const violationsByRisk: Record<string, number> = {};
    violations.forEachv => {
      violationsByRisk[((v.riskLevel)] = violationsByRisk[((v.riskLevel)] || 0) + 1;
    });

    return {
      totalViolations: violations.length,
      violationsByRisk,
      failedLogins: failedLogins.filter(l => l.result === 'failure').length,
      blockedActions: blockedActions.filter(a => a.result === 'blocked').length,
      timeRange: {
        start: oneDayAgo.toISOString(),
        end: new Date().toISOString()
      }
    };
  }
}
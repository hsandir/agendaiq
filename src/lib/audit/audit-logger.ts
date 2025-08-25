import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { Logger } from '@/lib/utils/logger';

// Safe audit data types
export type AuditFieldValue = string | number | boolean | null | undefined;
export type AuditRecord = Record<string, AuditFieldValue>;
export type AuditFieldChange = { old: AuditFieldValue; new: AuditFieldValue };
export type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

export interface AuditLogData {
  tableName: string;
  recordId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_CREATE' | 'BULK_UPDATE' | 'BULK_DELETE';
  fieldChanges?: Record<string, AuditFieldChange>;
  oldValues?: AuditRecord;
  newValues?: AuditRecord;
  userId?: number;
  staffId?: number;
  source: 'WEB_UI' | 'API' | 'BULK_UPLOAD' | 'SYSTEM';
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: AuditMetadata;
}

export class AuditLogger {
  static async log(data: AuditLogData) {
    try {
      await prisma.audit_logs.create({
        data: {
          table_name: data.tableName,
          record_id: data.recordId,
          operation: data.operation,
          field_changes: data.fieldChanges ?? undefined,
          old_values: data.oldValues ?? undefined,
          new_values: data.newValues ?? undefined,
          user_id: data.userId ?? null,
          staff_id: data.staffId ?? null,
          source: data.source,
          description: data.description ?? null,
          ip_address: data.ipAddress ?? null,
          user_agent: data.userAgent ?? null,
          metadata: data.metadata ?? undefined,
        }
      });
    } catch (error: unknown) {
      Logger.error('Failed to create audit log', { 
        error: String(error), 
        tableName: data.tableName, 
        operation: data.operation 
      }, 'audit');
      // Don't throw - audit logging should not break the main operation
    }
  }

  static async logFromRequest(request: NextRequest, data: Omit<AuditLogData, 'ipAddress' | 'userAgent'>) {
    const ip = (request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip')) ?? 'unknown';
    
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    return this.log({
      ...data,
      ipAddress: ip,
      userAgent
    });
  }

  // Helper methods for common operations
  static async logUserCreate(userId: number, userData: AuditRecord, source: AuditLogData['source'], metadata?: AuditMetadata) {
    return this.log({
      tableName: 'users',
      recordId: userId.toString(),
      operation: 'CREATE',
      newValues: userData,
      userId,
      source,
      description: `User created: ${userData.email}`,
      metadata
    });
  }

  static async logUserUpdate(userId: number, oldData: AuditRecord, newData: AuditRecord, changes: Record<string, AuditFieldChange>, source: AuditLogData['source']) {
    return this.log({
      tableName: 'users',
      recordId: userId.toString(),
      operation: 'UPDATE',
      fieldChanges: changes,
      oldValues: oldData,
      newValues: newData,
      userId,
      source,
      description: `User updated: ${Object.keys(changes).join(', ')}`
    });
  }

  static async logStaffCreate(staffId: number, staffData: AuditRecord, userId?: number, source: AuditLogData['source'] = 'WEB_UI', metadata?: AuditMetadata) {
    return this.log({
      tableName: 'staff',
      recordId: staffId.toString(),
      operation: 'CREATE',
      newValues: staffData,
      userId,
      staffId,
      source,
      description: `Staff record created for user ${staffData.user_id}`,
      metadata
    });
  }

  static async logStaffUpdate(staffId: number, oldData: AuditRecord, newData: AuditRecord, changes: Record<string, AuditFieldChange>, userId?: number, source: AuditLogData['source'] = 'WEB_UI') {
    return this.log({
      tableName: 'staff',
      recordId: staffId.toString(),
      operation: 'UPDATE',
      fieldChanges: changes,
      oldValues: oldData,
      newValues: newData,
      userId,
      staffId,
      source,
      description: `Staff updated: ${Object.keys(changes).join(', ')}`
    });
  }

  static async logBulkUpload(
    tableName: string, 
    recordCount: number, 
    userId?: number, 
    staffId?: number, 
    metadata?: AuditMetadata
  ) {
    return this.log({
      tableName,
      recordId: 'bulk',
      operation: 'BULK_CREATE',
      userId,
      staffId,
      source: 'BULK_UPLOAD',
      description: `Bulk upload: ${recordCount} ${tableName} records`,
      metadata: {
        record_count: recordCount,
        ...metadata
      }
    });
  }

  // Get audit logs with filters
  static async getAuditLogs(filters: {
    tableName?: string;
    operation?: string;
    userId?: number;
    staffId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: {
      table_name?: string;
      operation?: string;
      user_id?: number;
      staff_id?: number;
      created_at?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (filters.tableName) where.table_name = filters.tableName;
    if (filters.operation) where.operation = filters.operation;
    if (filters.userId) where.user_id = filters.userId;
    if (filters.staffId) where.staff_id = filters.staffId;
    
    if (filters.startDate ?? filters.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    return prisma.audit_logs.findMany({
      where,
      include: {
        users: {
          select: { id: true, email: true, name: true }
        },
        staff: {
          select: { 
            id: true,
            role: { select: { title: true } },
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0
    });
  }

  // Get summary statistics
  static async getAuditSummary(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalLogs, operationStats, tableStats, userStats] = await Promise.all([
      // Total logs count
      prisma.audit_logs.count({
        where: { created_at: { gte: startDate } }
      }),

      // Operations breakdown
      prisma.audit_logs.groupBy({
        by: ['operation'],
        where: { created_at: { gte: startDate } },
        _count: { operation: true }
      }),

      // Tables breakdown
      prisma.audit_logs.groupBy({
        by: ['table_name'],
        where: { created_at: { gte: startDate } },
        _count: { table_name: true }
      }),

      // Top users
      prisma.audit_logs.groupBy({
        by: ['user_id'],
        where: { 
          created_at: { gte: startDate },
          user_id: { not: null }
        },
        _count: { user_id: true },
        orderBy: { _count: { user_id: 'desc' } },
        take: 10
      });
    ]);

    return {
      totalLogs,
      operationStats: operationStats.map((stat) => ({
        operation: stat.operation,
        count: stat._count.operation
      })),
      tableStats: tableStats.map((stat) => ({
        table: stat.table_name,
        count: stat._count.table_name
      })),
      topUsers: userStats.map((stat) => ({
        userId: stat.user_id,
        count: stat._count.user_id
      }))
    };
  }
} 
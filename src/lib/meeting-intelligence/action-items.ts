// Action Items Tracking Module
// Enhanced action item management with tracking and analytics

import { prisma } from '@/lib/prisma';
import { ActionItemStatus } from './types';

export class ActionItemsService {
  /**
   * Create action item with role-based assignment
   */
  static async createActionItem(data: {
    meetingId: number;
    agendaItemId?: number;
    title: string;
    description?: string;
    assignedToStaffId: number;
    assignedToRoleId?: number;
    dueDate?: Date;
    priority?: 'Low' | 'Medium' | 'High';
  }) {
    // If role is specified, verify staff has that role
    if (data.assignedToRoleId) {
      const staff = await prisma.staff.findUnique({
        where: { id: data.assignedToStaffId }
      });
      
      if (staff?.role_id !== data.assignedToRoleId) {
        throw new Error('Staff does not hold the specified role');
      }
    }

    return await prisma.meetingActionItem.create({
      data: {
        meeting_id: data.meetingId,
        agenda_item_id: data.agendaItemId,
        title: data.title,
        description: data.description,
        assigned_to: data.assignedToStaffId,
        assigned_to_role: data.assignedToRoleId,
        due_date: data.dueDate,
        priority: data.priority || 'Medium',
        status: 'Pending'
      },
      include: {
        AssignedTo: {
          include: {
            User: true,
            Role: true
          }
        }
      }
    });
  }

  /**
   * Update action item status with tracking
   */
  static async updateActionItemStatus(
    actionItemId: number,
    status: keyof typeof ActionItemStatus,
    completedBy?: number,
    notes?: string
  ) {
    const updateData: Record<string, unknown> = {
      status,
      notes
    };

    if (status === 'Completed' && completedBy) {
      updateData.completed_at = new Date();
      updateData.completed_by = completedBy;
    }

    return await prisma.meetingActionItem.update({
      where: { id: actionItemId },
      data: updateData,
      include: {
        AssignedTo: {
          include: {
            User: true
          }
        },
        CompletedBy: {
          include: {
            User: true
          }
        }
      }
    });
  }

  /**
   * Get overdue action items
   */
  static async getOverdueActionItems(filterOptions?: {
    departmentId?: number;
    roleId?: number;
    staffId?: number;
  }) {
    const where: Record<string, unknown> = {
      status: {
        in: ['Pending', 'InProgress']
      },
      due_date: {
        lt: new Date()
      }
    };

    if (filterOptions?.staffId) {
      where.assigned_to = filterOptions.staffId;
    }

    if (filterOptions?.roleId) {
      where.assigned_to_role = filterOptions.roleId;
    }

    if (filterOptions?.departmentId) {
      where.Meeting = {
        department_id: parseInt(filterOptions).departmentId
      };
    }

    const overdueItems = await prisma.meetingActionItem.findMany({
      where,
      include: {
        Meeting: {
          select: {
            id: true,
            title: true,
            start_time: true
          }
        },
        AssignedTo: {
          include: {
            User: true,
            Role: true,
            Department: true
          }
        }
      },
      orderBy: [
        { due_date: 'asc' },
        { priority: 'desc' }
      ]
    });

    // Update status to Overdue
    const overdueIds = (overdueItems.map(item => item.id));
    if (overdueIds.length > 0) {
      await prisma.meetingActionItem.updateMany({
        where: {
          id: { in: overdueIds },
          status: { not: 'Overdue' }
        },
        data: {
          status: 'Overdue'
        }
      });
    }

    return overdueItems;
  }

  /**
   * Get action items by status
   */
  static async getActionItemsByStatus(
    status: keyof typeof ActionItemStatus,
    options?: {
      limit?: number;
      offset?: number;
      departmentId?: number;
      roleId?: number;
    }
  ) {
    const where: Record<string, unknown> = { status };

    if (options?.departmentId) {
      where.Meeting = {
        department_id: parseInt(options).departmentId
      };
    }

    if (options?.roleId) {
      where.assigned_to_role = options.roleId;
    }

    return await prisma.meetingActionItem.findMany({
      where,
      include: {
        Meeting: {
          select: {
            id: true,
            title: true,
            start_time: true,
            Department: true
          }
        },
        AssignedTo: {
          include: {
            User: true,
            Role: true
          }
        },
        AgendaItem: {
          select: {
            topic: true
          }
        }
      },
      orderBy: [
        { created_at: 'desc' }
      ],
      take: options?.limit,
      skip: options?.offset
    });
  }

  /**
   * Get action items statistics
   */
  static async getActionItemsStats(filterOptions?: {
    departmentId?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: Record<string, unknown> = {};

    if (filterOptions?.departmentId) {
      where.Meeting = {
        department_id: parseInt(filterOptions).departmentId
      };
    }

    if (filterOptions?.dateFrom || filterOptions?.dateTo) {
      where.created_at = {};
      if (filterOptions.dateFrom) {
        where.created_at.gte = filterOptions.dateFrom;
      }
      if (filterOptions.dateTo) {
        where.created_at.lte = filterOptions.dateTo;
      }
    }

    const [
      total,
      pending,
      inProgress,
      completed,
      overdue,
      cancelled,
      deferred
    ] = await Promise.all([
      prisma.meetingActionItem.count({ where }),
      prisma.meetingActionItem.count({ where: { ...where, status: 'Pending' } }),
      prisma.meetingActionItem.count({ where: { ...where, status: 'InProgress' } }),
      prisma.meetingActionItem.count({ where: { ...where, status: 'Completed' } }),
      prisma.meetingActionItem.count({ where: { ...where, status: 'Overdue' } }),
      prisma.meetingActionItem.count({ where: { ...where, status: 'Cancelled' } }),
      prisma.meetingActionItem.count({ where: { ...where, status: 'Deferred' } })
    ]);

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const overdueRate = total > 0 ? (overdue / total) * 100 : 0;

    // Average completion time
    const completedItems = await prisma.meetingActionItem.findMany({
      where: {
        ...where,
        status: 'Completed',
        completed_at: { not: null }
      },
      select: {
        created_at: true,
        completed_at: true
      }
    });

    let averageCompletionDays = 0;
    if (completedItems.length > 0) {
      const totalDays = completedItems.reduce((sum, item) => {
        const days = Math.floor(
          (item.completed_at!.getTime() - item.created_at.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      averageCompletionDays = totalDays / completedItems.length;
    }

    return {
      total,
      byStatus: {
        pending,
        inProgress,
        completed,
        overdue,
        cancelled,
        deferred
      },
      metrics: {
        completionRate: Math.round(completionRate * 10) / 10,
        overdueRate: Math.round(overdueRate * 10) / 10,
        averageCompletionDays: Math.round(averageCompletionDays * 10) / 10
      }
    };
  }

  /**
   * Get action items timeline
   */
  static async getActionItemsTimeline(
    staffId?: number,
    days = 30
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: Record<string, unknown> = {
      created_at: {
        gte: startDate
      }
    };

    if (staffId) {
      where.assigned_to = staffId;
    }

    const items = await prisma.meetingActionItem.findMany({
      where,
      include: {
        Meeting: {
          select: {
            title: true
          }
        },
        AssignedTo: {
          include: {
            User: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Group by date
    const timeline: Record<string, any[]> = {};
    items.forEach(item => {
      const dateKey = item.created_at.toISOString().split('T')[0];
      if (!timeline[dateKey]) {
        timeline[dateKey] = [];
      }
      timeline[dateKey].push(item);
    });

    return timeline;
  }

  /**
   * Bulk update action items
   */
  static async bulkUpdateActionItems(
    actionItemIds: number[],
    updates: {
      status?: keyof typeof ActionItemStatus;
      priority?: 'Low' | 'Medium' | 'High';
      dueDate?: Date;
      assignedTo?: number;
    }
  ) {
    return await prisma.meetingActionItem.updateMany({
      where: {
        id: { in: actionItemIds }
      },
      data: {
        status: updates.status,
        priority: updates.priority,
        due_date: updates.dueDate,
        assigned_to: updates.assignedTo
      }
    });
  }
}
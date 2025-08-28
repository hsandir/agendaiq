// Role-Based Assignment Module
// Handles role transitions and automatic task reassignment

import { prisma } from '@/lib/prisma';
import { RoleTransitionData } from './types';

export class RoleBasedAssignmentService {
  /**
   * Transfer all pending tasks when role changes hands
   */
  static async handleRoleTransition(data: RoleTransitionData) {
    return await prisma.$transaction(async (tx) => {
      // Create transition record
      const transition = await tx.role_transitions.create({
        data: {
          role_id: data.roleId,
          from_staff_id: data.fromStaffId,
          to_staff_id: data.toStaffId,
          pending_tasks: data.pendingTasks,
          transferred_items: data.transferredItems,
          notes: data.notes,
          created_by: data.toStaffId // For now, use the new staff as creator
        }
      });

      // Transfer agenda items assigned to role
      await tx.meeting_agenda_items.updateMany({
        where: {
          responsible_role_id: data.roleId,
          responsible_staff_id: data.fromStaffId,
          status: {
            in: ['Pending', 'Ongoing', 'Deferred']
          }
        },
        data: {
          responsible_staff_id: data.toStaffId
        }
      });

      // Transfer action items assigned to role
      await tx.meeting_action_items.updateMany({
        where: {
          assigned_to_role: data.roleId,
          assigned_to: data.fromStaffId,
          status: {
            in: ['Pending', 'InProgress', 'Deferred', 'Overdue']
          }
        },
        data: {
          assigned_to: data.toStaffId
        }
      });

      // Get summary of transferred items
      const [transferredAgendaItems, transferredActionItems] = await Promise.all([
        tx.meeting_agenda_items.count({
          where: {
            responsible_role_id: data.roleId,
            responsible_staff_id: data.toStaffId
          }
        }),
        tx.meeting_action_items.count({
          where: {
            assigned_to_role: data.roleId,
            assigned_to: data.toStaffId
          }
        })
      ]);

      return {
        transition,
        summary: {
          transferredAgendaItems,
          transferredActionItems,
          totalTransferred: transferredAgendaItems + transferredActionItems
        }
      };
    });
  }

  /**
   * Get all tasks assigned to a role
   */
  static async getRoleTasks(roleId: number, includeCompleted = false) {
    const agendaStatusFilter = includeCompleted 
      ? {} 
      : {
          status: {
            notIn: ['Resolved' as const]
          }
        };

    const actionStatusFilter = includeCompleted 
      ? {} 
      : {
          status: {
            notIn: ['Completed' as const, 'Cancelled' as const]
          }
        };

    const [agendaItems, actionItems] = await Promise.all([
      prisma.meeting_agenda_items.findMany({
        where: {
          responsible_role_id: roleId,
          ...agendaStatusFilter
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              start_time: true
            }
          },
          staff: {
            select: {
              id: true,
              users: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ]
      }),
      
      prisma.meeting_action_items.findMany({
        where: {
          assigned_to_role: roleId,
          ...actionStatusFilter
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              start_time: true
            }
          },
          staff_meeting_action_items_assigned_toTostaff: {
            select: {
              id: true,
              users: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { due_date: 'asc' },
          { priority: 'desc' }
        ]
      })
    ]);

    return {
      agendaItems,
      actionItems,
      total: agendaItems.length + actionItems.length
    };
  }

  /**
   * Assign task to role (automatically assigns to current role holder)
   */
  static async assignTaskToRole(
    taskId: number,
    roleId: number,
    taskType: 'agenda' | 'action'
  ) {
    // Get current role holder
    const currentRoleHolder = await prisma.staff.findFirst({
      where: {
        role_id: roleId,
        is_active: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!currentRoleHolder) {
      throw new Error('No active staff member found for this role');
    }

    if (taskType === 'agenda') {
      return await prisma.meeting_agenda_items.update({
        where: { id: taskId },
        data: {
          responsible_role_id: roleId,
          responsible_staff_id: currentRoleHolder.id
        }
      });
    } else {
      return await prisma.meeting_action_items.update({
        where: { id: taskId },
        data: {
          assigned_to_role: roleId,
          assigned_to: currentRoleHolder.id
        }
      });
    }
  }

  /**
   * Get role transition history
   */
  static async getRoleTransitionHistory(roleId: number) {
    return await prisma.role_transitions.findMany({
      where: { role_id: roleId },
      include: {
        staff_role_transitions_from_staff_idTostaff: {
          include: {
            users: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        staff_role_transitions_to_staff_idTostaff: {
          include: {
            users: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        role: true
      },
      orderBy: {
        transition_date: 'desc'
      }
    });
  }

  /**
   * Get upcoming tasks for a role
   */
  static async getUpcomingRoleTasks(roleId: number, days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.meeting_action_items.findMany({
      where: {
        assigned_to_role: roleId,
        status: {
          in: ['Pending', 'InProgress']
        },
        due_date: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        meeting: {
          select: {
            title: true
          }
        },
        staff_meeting_action_items_assigned_toTostaff: {
          include: {
            users: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        due_date: 'asc'
      }
    });
  }

  /**
   * Bulk reassign tasks from one staff to another (same role)
   */
  static async bulkReassignTasks(
    fromStaffId: number,
    toStaffId: number,
    taskIds: { agendaItems?: number[], actionItems?: number[] }
  ) {
    return await prisma.$transaction(async (tx) => {
      const results = {
        agendaItemsUpdated: 0,
        actionItemsUpdated: 0
      };

      if (taskIds.agendaItems && taskIds.agendaItems.length > 0) {
        const agendaUpdate = await tx.meeting_agenda_items.updateMany({
          where: {
            id: { in: taskIds.agendaItems },
            responsible_staff_id: fromStaffId
          },
          data: {
            responsible_staff_id: toStaffId
          }
        });
        results.agendaItemsUpdated = agendaUpdate.count;
      }

      if (taskIds.actionItems && taskIds.actionItems.length > 0) {
        const actionUpdate = await tx.meeting_action_items.updateMany({
          where: {
            id: { in: taskIds.actionItems },
            assigned_to: fromStaffId
          },
          data: {
            assigned_to: toStaffId
          }
        });
        results.actionItemsUpdated = actionUpdate.count;
      }

      return results;
    });
  }
}
// Meeting Analytics Module
// Analytics and reporting capabilities for meetings

import { prisma } from '@/lib/prisma';
import { MeetingAnalytics, DepartmentStats } from './types';

export class MeetingAnalyticsService {
  /**
   * Get comprehensive meeting analytics
   */
  static async getMeetingAnalytics(options?: {
    departmentId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    schoolId?: number;
  }): Promise<MeetingAnalytics> {
    const where: Record<string, unknown> = {};

    if (options?.departmentId) {
      where.department_id = options.departmentId;
    }

    if (options?.schoolId) {
      where.school_id = options.schoolId;
    }

    if (options?.dateFrom || options?.dateTo) {
      where.start_time = {};
      if (options.dateFrom) {
        (where.start_time as Record<string, unknown>).gte = options.dateFrom;
      }
      if (options.dateTo) {
        (where.start_time as Record<string, unknown>).lte = options.dateTo;
      }
    }

    // Get basic meeting statistics
    const [
      totalMeetings,
      meetings,
      actionItems,
      departments
    ] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.findMany({
        where,
        select: {
          id: true,
          start_time: true,
          end_time: true,
          meeting_attendee: true,
          meeting_agenda_items: {
            where: { carried_forward: true }
          }
        }
      }),
      prisma.meeting_action_items.findMany({
        where: {
          meeting: where
        },
        select: {
          status: true
        }
      }),
      prisma.department.findMany({
        where: options?.departmentId ? { id: options.departmentId } : {},
        select: {
          id: true,
          name: true
        }
      })
    ]);

    // Calculate action item statistics
    const completedActions = actionItems.filter(a => a.status === 'Completed').length;
    const pendingActions = actionItems.filter(a => a.status === 'Pending').length;
    const overdueActions = actionItems.filter(a => a.status === 'Overdue').length;

    // Calculate average duration (in minutes)
    let totalDuration = 0;
    let meetingsWithDuration = 0;
    meetings.forEach(meeting => {
      if (meeting.start_time && meeting.end_time) {
        const duration = (meeting.end_time.getTime() - meeting.start_time.getTime()) / (1000 * 60);
        totalDuration += duration;
        meetingsWithDuration++;
      }
    });
    const averageDuration = meetingsWithDuration > 0 ? totalDuration / meetingsWithDuration : 0;

    // Calculate participation rate
    const totalAttendees = meetings.reduce((sum, m) => sum + m.meeting_attendee.length, 0);
    const participationRate = totalMeetings > 0 ? totalAttendees / totalMeetings : 0;

    // Calculate carry forward rate
    const meetingsWithCarriedItems = meetings.filter(m => m.meeting_agenda_items.length > 0).length;
    const carryForwardRate = totalMeetings > 0 ? (meetingsWithCarriedItems / totalMeetings) * 100 : 0;

    // Get department breakdown
    const departmentBreakdown = (await this.getDepartmentStatistics(departments.map(d => d.id), where));

    return {
      totalMeetings,
      completedActions,
      pendingActions,
      overdueActions,
      averageDuration: Math.round(averageDuration),
      participationRate: Math.round(participationRate * 10) / 10,
      carryForwardRate: Math.round(carryForwardRate * 10) / 10,
      departmentBreakdown
    };
  }

  /**
   * Get department-specific statistics
   */
  private static async getDepartmentStatistics(
    departmentIds: number[],
    baseWhere: Record<string, unknown>
  ): Promise<DepartmentStats[]> {
    const stats: DepartmentStats[] = [];

    for (const deptId of departmentIds) {
      const where = { ...baseWhere, department_id: parseInt(deptId) };

      const [
        department,
        meetingCount,
        actionItems,
        attendanceData
      ] = await Promise.all([
        prisma.department.findUnique({
          where: { id: deptId },
          select: { name: true }
        }),
        prisma.meeting.count({ where }),
        prisma.meeting_action_items.findMany({
          where: {
            meeting: where
          },
          select: { status: true }
        }),
        prisma.meeting.findMany({
          where,
          select: {
            meeting_attendee: true
          }
        })
      ]);

      if (!department) continue;

      const completedActions = actionItems.filter(a => a.status === 'Completed').length;
      const completionRate = actionItems.length > 0 
        ? (completedActions / actionItems.length) * 100 
        : 0;

      const totalAttendees = attendanceData.reduce((sum, m) => sum + m.meeting_attendee.length, 0);
      const averageAttendance = meetingCount > 0 ? totalAttendees / meetingCount : 0;

      stats.push({
        departmentId: deptId,
        departmentName: department.name,
        meetingCount,
        actionItemCount: actionItems.length,
        completionRate: Math.round(completionRate * 10) / 10,
        averageAttendance: Math.round(averageAttendance * 10) / 10
      });
    }

    return stats;
  }

  /**
   * Get meeting trends over time
   */
  static async getMeetingTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    duration = 12
  ) {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - duration);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - (duration * 7));
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - duration);
        break;
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        start_time: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        start_time: true,
        meeting_action_items: {
          select: {
            status: true
          }
        }
      },
      orderBy: {
        start_time: 'asc'
      }
    });

    // Group by period
    const trends: Record<string, unknown> = {};

    meetings.forEach(meeting => {
      if (!meeting.start_time) return;

      let periodKey: string;
      const date = new Date(meeting.start_time);

      switch (period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!trends[periodKey]) {
        trends[periodKey] = {
          period: periodKey,
          meetings: 0,
          actionItems: 0,
          completedActions: 0
        };
      }

      trends[periodKey].meetings++;
      trends[periodKey].actionItems += meeting.MeetingActionItems.length;
      trends[periodKey].completedActions += meeting.MeetingActionItems.filter(
        a => a.status === 'Completed'
      ).length;
    });

    return Object.values(trends).sort((a, b) => 
      a.period.localeCompare(b.period)
    );
  }

  /**
   * Get staff participation statistics
   */
  static async getStaffParticipation(
    staffId?: number,
    options?: {
      dateFrom?: Date;
      dateTo?: Date;
    }
  ) {
    const where: Record<string, unknown> = {};

    if (staffId) {
      where.staff_id = staffId;
    }

    if (options?.dateFrom ?? options?.dateTo) {
      where.Meeting = {
        start_time: {}
      };
      if (options.dateFrom) {
        where.meeting.start_time.gte = options.dateFrom;
      }
      if (options.dateTo) {
        where.meeting.start_time.lte = options.dateTo;
      }
    }

    const attendance = await prisma.meeting_attendee.findMany({
      where,
      include: {
        staff: {
          include: {
            users: {
              select: {
                name: true,
                email: true
              }
            },
            role: true,
            department: true
          }
        },
        meeting: {
          select: {
            title: true,
            start_time: true
          }
        }
      }
    });

    // Group by staff
    const staffStats: Record<number, any> = {};

    attendance.forEach(record => {
      const staffId = record.staff_id;
      
      if (!staffStats[staffId]) {
        staffStats[staffId] = {
          staffId,
          name: record.staff.users.name,
          email: record.staff.users.email,
          role: record.staff.role.key ?? record.staff.role.id,
          department: record.staff.department.name,
          meetingsAttended: 0,
          lastmeeting: null
        };
      }

      staffStats[staffId].meetingsAttended++;
      
      if (!staffStats[staffId].lastMeeting || 
          (record.meeting.start_time && record.meeting.start_time > staffStats[staffId].lastMeeting)) {
        staffStats[staffId].lastMeeting = record.meeting.start_time;
      }
    });

    return Object.values(staffStats).sort((a, b) => 
      b.meetingsAttended - a.meetingsAttended
    );
  }

  /**
   * Get action item performance metrics
   */
  static async getActionItemPerformance(options?: {
    departmentId?: number;
    roleId?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: Record<string, unknown> = {};

    if (options?.roleId) {
      where.assigned_to_role = options.roleId;
    }

    if (options?.departmentId) {
      where.Meeting = {
        department_id: parseInt(options).departmentId
      };
    }

    if (options?.dateFrom ?? options?.dateTo) {
      where.created_at = {};
      if (options.dateFrom) {
        where.created_at.gte = options.dateFrom;
      }
      if (options.dateTo) {
        where.created_at.lte = options.dateTo;
      }
    }

    const actionItems = await prisma.meeting_action_items.findMany({
      where,
      include: {
        assigned_to: {
          include: {
            users: {
              select: {
                name: true
              }
            },
            role: true
          }
        }
      }
    });

    // Calculate metrics
    const metrics = {
      total: actionItems.length,
      byStatus: {
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        cancelled: 0,
        deferred: 0
      },
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      averageCompletionTime: 0,
      onTimeCompletionRate: 0
    };

    let totalCompletionTime = 0;
    let completedWithDueDate = 0;
    let completedOnTime = 0;

    actionItems.forEach(item => {
      // Count by status
      const status = item.status.toLowerCase().replace('_', '');
      if (status in metrics.byStatus) {
        metrics.byStatus[status]++;
      }

      // Count by priority
      const priority = item.priority.toLowerCase();
      if (priority in metrics.byPriority) {
        metrics.byPriority[priority]++;
      }

      // Calculate completion time
      if (item.status === 'Completed' && item.completed_at) {
        const completionTime = item.completed_at.getTime() - item.created_at.getTime();
        totalCompletionTime += completionTime;

        if (item.due_date) {
          completedWithDueDate++;
          if (item.completed_at <= item.due_date) {
            completedOnTime++;
          }
        }
      }
    });

    // Calculate averages
    const completedCount = metrics.byStatus.completed;
    if (completedCount > 0) {
      metrics.averageCompletionTime = Math.round(
        totalCompletionTime / completedCount / (1000 * 60 * 60 * 24)
      ); // in days
    }

    if (completedWithDueDate > 0) {
      metrics.onTimeCompletionRate = Math.round(
        (completedOnTime / completedWithDueDate) * 100
      );
    }

    return metrics;
  }

  /**
   * Get meeting efficiency score
   */
  static async getMeetingEfficiencyScore(meetingId: number) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        meeting_agenda_items: true,
        meeting_action_items: true,
        meeting_attendee: true
      }
    });

    if (!meeting) return null;

    let score = 0;
    const factors = [];

    // Factor 1: Meeting duration (optimal: 30-90 minutes)
    if (meeting.start_time && meeting.end_time) {
      const duration = (meeting.end_time.getTime() - meeting.start_time.getTime()) / (1000 * 60);
      if (duration >= 30 && duration <= 90) {
        score += 20;
        factors.push({ factor: 'Duration', score: 20, note: 'Optimal duration' });
      } else if (duration < 30) {
        score += 10;
        factors.push({ factor: 'Duration', score: 10, note: 'Too short' });
      } else {
        score += 5;
        factors.push({ factor: 'Duration', score: 5, note: 'Too long' });
      }
    }

    // Factor 2: Agenda completion
    const totalAgendaItems = meeting.meeting_agenda_items.length;
    const resolvedItems = meeting.meeting_agenda_items.filter(i => i.status === 'Resolved').length;
    if (totalAgendaItems > 0) {
      const completionRate = (resolvedItems / totalAgendaItems) * 20;
      score += completionRate;
      factors.push({ 
        factor: 'Agenda Completion', 
        score: Math.round(completionRate), 
        note: `${resolvedItems}/${totalAgendaItems} items resolved` 
      });
    }

    // Factor 3: Action items generated
    const actionItemsCount = meeting.MeetingActionItems.length;
    if (actionItemsCount > 0) {
      score += Math.min(20, actionItemsCount * 4);
      factors.push({ 
        factor: 'Action Items', 
        score: Math.min(20, actionItemsCount * 4), 
        note: `${actionItemsCount} action items created` 
      });
    }

    // Factor 4: Attendance rate
    const attendanceCount = meeting.meeting_attendee.length;
    if (attendanceCount >= 3) {
      score += 20;
      factors.push({ 
        factor: 'Attendance', 
        score: 20, 
        note: `${attendanceCount} attendees` 
      });
    } else if (attendanceCount > 0) {
      score += 10;
      factors.push({ 
        factor: 'Attendance', 
        score: 10, 
        note: `${attendanceCount} attendees (low)` 
      });
    }

    // Factor 5: Follow-up (if it has continuation meetings)
    const hasContinuation = await prisma.meeting.count({
      where: { parent_meeting_id: meetingId }
    });
    if (hasContinuation > 0) {
      score += 20;
      factors.push({ 
        factor: 'Follow-up', 
        score: 20, 
        note: 'Has continuation meetings' 
      });
    }

    return {
      score: Math.min(100, score),
      factors,
      grade: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor'
    };
  }
}
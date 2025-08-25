// Meeting Continuity Module
// Handles parent-child meeting relationships and carry-forward logic

import { prisma } from '@/lib/prisma';
import { CarriedAgendaItem, PendingActionItem, MeetingContinuityData } from './types';

export class MeetingContinuityService {
  /**
   * Get unresolved items from a meeting to carry forward
   */
  static async getUnresolvedItems(meetingId: number): Promise<MeetingContinuityData> {
    const [agendaItems, actionItems] = await Promise.all([
      // Get unresolved agenda items
      prisma.meeting_agenda_items.findMany({
        where: {
          meeting_id: meetingId,
          status: {
            in: ['Pending', 'Ongoing', 'Deferred']
          }
        },
        include: {
          staff: true,
          ResponsibleRole: true
        }
      }),
      
      // Get incomplete action items
      prisma.meeting_action_items.findMany({
        where: {
          meeting_id: meetingId,
          status: {
            in: ['Pending', 'InProgress', 'Deferred', 'Overdue']
          }
        },
        include: {
          assigned_to: true,
          AssignedToRole: true
        }
      })
    ]);

    return {
      parentMeetingId: meetingId,
      carriedItems: agendaItems.map(item => ({
        parentItemId: item.id,
        topic: item.topic,
        problemStatement: item.problem_statement ?? undefined,
        responsibleRoleId: item.responsible_role_id ?? undefined,
        responsibleStaffId: item.responsible_staff_id ?? undefined,
        priority: item.priority,
        status: 'CarriedForward' as const,
        carryForwardCount: item.carry_forward_count + 1,
        notes: item.decisions_actions ?? undefined
      })),
      pendingActions: actionItems.map(item => ({
        parentActionId: item.id,
        title: item.title,
        description: item.description ?? undefined,
        assignedToRoleId: item.assigned_to_role ?? undefined,
        assignedToStaffId: item.assigned_to,
        dueDate: item.due_date ?? undefined,
        priority: item.priority,
        status: item.status as Record<string, unknown>,
        carryForwardCount: item.carry_forward_count + 1
      }))
    };
  }

  /**
   * Create a continuation meeting with carried items
   */
  static async createContinuationMeeting(
    parentMeetingId: number,
    newMeetingData: Record<string, unknown>
  ) {
    const continuityData = await this.getUnresolvedItems(parentMeetingId);
    
    return await prisma.$transaction(async (tx) => {
      // Create the new meeting
      const newMeeting = await tx.meeting.create({
        data: {
          ...newMeetingData,
          parent_meeting_id: parentMeetingId,
          is_continuation: true
        }
      });

      // Carry forward agenda items
      if (continuityData.carriedItems.length > 0) {
        await tx.meeting_agenda_items.createMany({
          data: continuityData.carriedItems.map((item, index) => ({
            meeting_id: newMeeting.id,
            topic: `[Carried Forward] ${item.topic}`,
            problem_statement: item.problemStatement,
            responsible_staff_id: item.responsibleStaffId,
            responsible_role_id: parseInt(item).responsibleRoleId,
            priority: item.priority,
            status: 'Pending',
            parent_item_id: item.parentItemId,
            carried_forward: true,
            carry_forward_count: item.carryForwardCount,
            order_index: index,
            purpose: 'Discussion',
            created_at: new Date()
          }))
        });
      }

      // Carry forward action items
      if (continuityData.pendingActions.length > 0) {
        await tx.meetingActionItem.createMany({
          data: continuityData.pendingActions.map(action => ({
            meeting_id: newMeeting.id,
            title: action.title,
            description: action.description,
            assigned_to: action.assignedToStaffId!,
            assigned_to_role: action.assignedToRoleId,
            due_date: action.dueDate,
            priority: action.priority,
            status: action.status,
            parent_action_id: action.parentActionId,
            carry_forward_count: action.carryForwardCount,
            created_at: new Date()
          }))
        });
      }

      return newMeeting;
    });
  }

  /**
   * Get meeting continuation chain
   */
  static async getMeetingChain(meetingId: number) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        Parentmeeting: true,
        continuation_meetings: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!meeting) return null;

    // Get the root meeting
    let rootMeeting = meeting;
    while (rootMeeting.ParentMeeting) {
      const parent = await prisma.meeting.findUnique({
        where: { id: rootMeeting.parent_meeting_id! },
        include: { 
          Parentmeeting: true,
          continuation_meetings: {
            orderBy: { created_at: 'asc' }
          }
        }
      });
      if (!parent) break;
      rootMeeting = parent;
    }

    // Get all meetings in the chain
    const getAllDescendants = async (id: number): Promise<any[]> => {
      const children = await prisma.meeting.findMany({
        where: { parent_meeting_id: id },
        include: {
          meeting_agenda_items: { 
            where: { carried_forward: true },
            select: { id: true, topic: true, status: true }
          },
          meeting_action_items: {
            where: { parent_action_id: { not: null } },
            select: { id: true, title: true, status: true }
          }
        }
      });

      const descendants = [];
      for (const child of children) {
        const childDescendants = await getAllDescendants(child.id);
        descendants.push({
          ...child,
          children: childDescendants
        });
      }
      return descendants;
    };

    return {
      root: rootmeeting,
      chain: await getAllDescendants(rootMeeting.id),
      currentmeeting: meeting
    };
  }

  /**
   * Generate continuation summary
   */
  static async generateContinuationSummary(meetingId: number) {
    const chain = await this.getMeetingChain(meetingId);
    if (!chain) return null;

    const stats = {
      totalMeetingsInChain: 1,
      totalCarriedItems: 0,
      resolvedItems: 0,
      pendingItems: 0,
      averageCarryCount: 0
    };

    // Calculate statistics
    const countMeetings = (meetings: Record<string, unknown>[]): void => {
      for (const meeting of meetings) {
        stats.totalMeetingsInChain++;
        stats.totalCarriedItems += meeting.MeetingAgendaItems?.length ?? 0;
        stats.resolvedItems += meeting.MeetingAgendaItems?.filter(
          (i: Record<string, unknown>) => i.status === 'Resolved'
        ).length ?? 0;
        stats.pendingItems += meeting.MeetingAgendaItems?.filter(
          (i: Record<string, unknown>) => i.status !== 'Resolved'
        ).length ?? 0;
        
        if (meeting.children) {
          countMeetings(meeting.children);
        }
      }
    };

    countMeetings(chain.chain);
    
    if (stats.totalCarriedItems > 0) {
      const items = await prisma.meeting_agenda_items.findMany({
        where: { 
          meeting_id: meetingId,
          carried_forward: true
        },
        select: { carry_forward_count: true }
      });
      
      const totalCarries = items.reduce((sum, item) => sum + item.carry_forward_count, 0);
      stats.averageCarryCount = totalCarries / items.length;
    }

    return stats;
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Fetch meetings with parent-child relationships
    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          { parent_meeting_id: { not: null } },
          { 
            ContinuationMeetings: {
              some: {}
            }
          }
        ]
      },
      include: {
        ParentMeeting: true,
        ContinuationMeetings: {
          include: {
            MeetingAgendaItems: true,
            MeetingActionItems: true,
            MeetingAttendee: true
          }
        },
        MeetingAgendaItems: {
          include: {
            ResponsibleRole: true
          }
        },
        MeetingActionItems: {
          include: {
            AssignedToRole: true
          }
        },
        MeetingAttendee: true,
        Department: true
      },
      orderBy: {
        start_time: 'desc'
      }
    });
    
    // Build meeting chains
    const chainsMap = new Map();
    
    meetings.forEach(meeting => {
      // Find root meeting
      let rootId = meeting.id;
      let parentId = meeting.parent_meeting_id;
      
      // Traverse up to find root (without ParentMeeting object)
      while (parentId) {
        const parent = meetings.find(m => m.id === parentId);
        if (!parent) break;
        rootId = parent.id;
        parentId = parent.parent_meeting_id;
      }
      
      const chainId = rootId;
      
      if (!chainsMap.has(chainId)) {
        const rootMeeting = meetings.find(m => m.id === rootId) || meeting;
        chainsMap.set(chainId, {
          id: chainId,
          rootMeeting: {
            id: rootMeeting.id,
            title: rootMeeting.title,
            date: rootMeeting.start_time?.toISOString() || new Date().toISOString(),
            status: rootMeeting.status
          },
          meetings: [],
          totalMeetings: 0,
          totalAgendaItems: 0,
          totalActionItems: 0,
          resolvedItems: 0,
          unresolvedItems: 0
        });
      }
    });
    
    // Build tree structure for each chain
    chainsMap.forEach((chain, chainId) => {
      const rootMeeting = meetings.find(m => m.id === chainId);
      if (rootMeeting) {
        chain.meetings = [buildMeetingNode(rootMeeting, meetings)];
        
        // Calculate chain stats
        const allMeetingsInChain = getAllMeetingsInChain(chain.meetings[0]);
        chain.totalMeetings = allMeetingsInChain.length;
        
        allMeetingsInChain.forEach(node => {
          chain.totalAgendaItems += node.agendaItems.total;
          chain.totalActionItems += node.actionItems.total;
          chain.resolvedItems += node.agendaItems.resolved + node.actionItems.completed;
          chain.unresolvedItems += (node.agendaItems.total - node.agendaItems.resolved) + 
                                   (node.actionItems.total - node.actionItems.completed);
        });
        
        chain.efficiency = chain.totalAgendaItems + chain.totalActionItems > 0
          ? Math.round((chain.resolvedItems / (chain.totalAgendaItems + chain.totalActionItems)) * 100)
          : 100;
      }
    });
    
    const chains = Array.from(chainsMap.values());
    
    // Calculate overall stats
    const stats = {
      totalChains: chains.length,
      averageChainLength: chains.length > 0 
        ? chains.reduce((sum, c) => sum + c.totalMeetings, 0) / chains.length
        : 0,
      longestChain: Math.max(...chains.map(c => c.totalMeetings), 0),
      totalCarriedItems: meetings.reduce((sum, m) => 
        sum + m.MeetingAgendaItems.filter((i: { carried_forward: boolean }) => i.carried_forward).length, 0
      ),
      resolutionRate: chains.reduce((sum, c) => sum + c.efficiency, 0) / (chains.length || 1),
      averageResolutionTime: 7 // Simplified - would need more complex calculation
    };
    
    return NextResponse.json({
      chains,
      stats
    });
    
  } catch (error) {
    console.error('Continuity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch continuity data' },
      { status: 500 }
    );
  }
}

function buildMeetingNode(meeting: Record<string, unknown>, allMeetings: Record<string, unknown>[]): Record<string, unknown> {
  const children = allMeetings.filter(m => m.parent_meeting_id === meeting.id);
  
  return {
    id: meeting.id,
    title: meeting.title,
    date: meeting.start_time?.toISOString() || new Date().toISOString(),
    status: meeting.status,
    parentId: meeting.parent_meeting_id,
    children: children.map(child => buildMeetingNode(child, allMeetings)),
    agendaItems: {
      total: meeting.MeetingAgendaItems.length,
      resolved: meeting.MeetingAgendaItems.filter((i: { status: string }) => i.status === 'Resolved').length,
      carriedForward: meeting.MeetingAgendaItems.filter((i: { carried_forward: boolean }) => i.carried_forward).length
    },
    actionItems: {
      total: meeting.MeetingActionItems.length,
      completed: meeting.MeetingActionItems.filter((i: { status: string }) => i.status === 'Completed').length,
      pending: meeting.MeetingActionItems.filter((i: { status: string }) => i.status === 'Pending').length,
      overdue: meeting.MeetingActionItems.filter((i: { due_date?: Date; status: string }) => {
        return i.due_date && i.due_date < new Date() && i.status !== 'Completed';
      }).length
    },
    attendeeCount: meeting.MeetingAttendee.length,
    duration: meeting.start_time && meeting.end_time
      ? Math.round((meeting.end_time.getTime() - meeting.start_time.getTime()) / 60000)
      : 60
  };
}

function getAllMeetingsInChain(node: Record<string, unknown>): Record<string, unknown>[] {
  return [node, ...node.children.flatMap(getAllMeetingsInChain)];
}
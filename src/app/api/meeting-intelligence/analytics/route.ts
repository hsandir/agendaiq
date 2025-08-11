import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'month';
    const department = searchParams.get('department') || 'all';
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    // Base query conditions
    const whereConditions: Record<string, unknown> = {
      start_time: {
        gte: startDate,
        lte: now
      }
    };
    
    if (department !== 'all') {
      whereConditions.Department = {
        name: department
      };
    }
    
    // Fetch meetings
    const meetings = await prisma.meeting.findMany({
      where: whereConditions,
      include: {
        MeetingAgendaItems: true,
        MeetingActionItems: true,
        MeetingAttendee: true,
        Department: true,
        Staff: {
          include: {
            User: true,
            Role: true
          }
        }
      }
    });
    
    // Calculate metrics
    const totalMeetings = meetings.length;
    const totalDuration = meetings.reduce((sum, m) => {
      if (m.start_time && m.end_time) {
        return sum + (m.end_time.getTime() - m.start_time.getTime()) / 60000;
      }
      return sum;
    }, 0);
    
    const averageDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;
    const averageAttendees = totalMeetings > 0 
      ? Math.round(meetings.reduce((sum, m) => sum + m.MeetingAttendee.length, 0) / totalMeetings)
      : 0;
    
    // Calculate completion rates
    const completedMeetings = meetings.filter(m => m.status === 'completed').length;
    const completionRate = totalMeetings > 0 
      ? Math.round((completedMeetings / totalMeetings) * 100)
      : 0;
    
    // Calculate on-time start rate (would need actual_start_time field)
    const onTimeStartRate = 0; // Placeholder until we add actual_start_time to schema
    
    // Calculate action item completion rate
    const totalActionItems = meetings.reduce((sum, m) => sum + m.MeetingActionItems.length, 0);
    const completedActionItems = meetings.reduce((sum, m) => 
      sum + m.MeetingActionItems.filter((a: { status: string }) => a.status === 'Completed').length, 0
    );
    const actionItemCompletionRate = totalActionItems > 0
      ? Math.round((completedActionItems / totalActionItems) * 100)
      : 0;
    
    // Meeting types distribution
    const meetingsByType = meetings.reduce((acc: Array<{ type: string; count: number }>, m) => {
      const existing = acc.find(t => t.type === (m.meeting_type || 'general'));
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: m.meeting_type || 'general', count: 1 });
      }
      return acc;
    }, []);
    
    // Department performance
    const departmentMap = new Map();
    meetings.forEach(m => {
      if (m.Department) {
        const key = m.Department.name;
        if (!departmentMap.has(key)) {
          departmentMap.set(key, {
            department: key,
            count: 0,
            totalDuration: 0,
            actionItems: 0,
            completedItems: 0
          });
        }
        const dept = departmentMap.get(key);
        dept.count++;
        if (m.start_time && m.end_time) {
          dept.totalDuration += (m.end_time.getTime() - m.start_time.getTime()) / 60000;
        }
        dept.actionItems += m.MeetingActionItems.length;
        dept.completedItems += m.MeetingActionItems.filter((a: { status: string }) => a.status === 'Completed').length;
      }
    });
    
    const meetingsByDepartment = Array.from(departmentMap.values()).map(dept => ({
      department: dept.department,
      count: dept.count,
      efficiency: dept.actionItems > 0 
        ? Math.round((dept.completedItems / dept.actionItems) * 100)
        : 100
    }));
    
    const departmentPerformance = Array.from(departmentMap.values()).map(dept => ({
      department: dept.department,
      meetings: dept.count,
      avgDuration: dept.count > 0 ? Math.round(dept.totalDuration / dept.count) : 0,
      actionItems: dept.actionItems,
      completionRate: dept.actionItems > 0 
        ? Math.round((dept.completedItems / dept.actionItems) * 100)
        : 100,
      efficiency: dept.actionItems > 0 
        ? Math.round((dept.completedItems / dept.actionItems) * 100)
        : 100
    }));
    
    // Trend data (simplified)
    const trendData = [
      { month: 'Jan', meetings: 12, efficiency: 75 },
      { month: 'Feb', meetings: 15, efficiency: 78 },
      { month: 'Mar', meetings: 18, efficiency: 82 },
      { month: 'Apr', meetings: totalMeetings, efficiency: actionItemCompletionRate }
    ];
    
    // Top contributors
    const contributorMap = new Map();
    meetings.forEach(m => {
      if (m.Staff?.User) {
        const key = m.Staff.User.id;
        if (!contributorMap.has(key)) {
          contributorMap.set(key, {
            name: m.Staff.User.name || 'Unknown',
            role: m.Staff.Role?.title || 'Staff',
            contributions: 0
          });
        }
        contributorMap.get(key).contributions++;
      }
    });
    
    const topContributors = Array.from(contributorMap.values())
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 5);
    
    return NextResponse.json({
      metrics: {
        totalMeetings,
        averageDuration,
        averageAttendees,
        completionRate,
        onTimeStartRate,
        actionItemCompletionRate,
        meetingsByType,
        meetingsByDepartment,
        trendData,
        topContributors
      },
      departmentPerformance
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
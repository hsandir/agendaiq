import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') ?? 'month';
    const department = searchParams.get('department') ?? 'all';
    
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
      whereConditions.department = {
        name: department
      };
    }
    
    // Fetch meetings
    const meetings = await prisma.meeting.findMany({
      where: whereConditions,
      include: {
        meeting_agenda_items: true,
        meeting_action_items: true,
        meeting_attendee: true,
        department: true,
        staff: {
          include: {
            users: true,
            role: true
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
      ? Math.round(meetings.reduce((sum, m) => sum + m.meeting_attendee.length, 0) / totalMeetings)
      : 0;
    
    // Calculate completion rates
    const completedMeetings = meetings.filter(m => m.status === 'completed').length;
    const completionRate = totalMeetings > 0 
      ? Math.round((completedMeetings / totalMeetings) * 100)
      : 0;
    
    // Calculate on-time start rate (would need actual_start_time field)
    const onTimeStartRate = 0; // Placeholder until we add actual_start_time to schema
    
    // Calculate action item completion rate
    const totalActionItems = meetings.reduce((sum, m) => sum + m.meeting_action_items.length, 0);
    const completedActionItems = meetings.reduce((sum, m) => 
      sum + m.meeting_action_items.filter((a: { status: string }) => a.status === 'Completed').length, 0
    );
    const actionItemCompletionRate = totalActionItems > 0
      ? Math.round((completedActionItems / totalActionItems) * 100)
      : 0;
    
    // Meeting types distribution
    const meetingsByType = meetings.reduce((acc: Array<{ type: string; count: number }>, m) => {
      const existing = acc.find(t => t.type === (m.meeting_type ?? 'general'));
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: m.meeting_type ?? 'general', count: 1 });
      }
      return acc;
    }, []);
    
    // Department performance
    const departmentMap = new Map();
    meetings.forEach(m => {
      if (m.department) {
        const key = m.department.name;
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
        dept.actionItems += m.meeting_action_items.length;
        dept.completedItems += m.meeting_action_items.filter((a: { status: string }) => a.status === 'Completed').length;
      }
    });
    
    const meetingsByDepartment = (Array.from(departmentMap.values()).map(dept => ({
      department: dept.department,
      count: dept.count,
      efficiency: dept.actionItems > 0 
        ? Math.round((dept.completedItems / dept.actionItems) * 100)
        : 100
    })));
    
    const departmentPerformance = (Array.from(departmentMap.values()).map(dept => ({
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
    })));
    
    // Generate real trend data based on actual meeting data
    const trendData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Group meetings by month
    const monthlyData = new Map();
    meetings.forEach(meeting => {
      if (meeting.start_time) {
        const date = new Date(meeting.start_time);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
        const monthName = monthNames[date.getMonth()];
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthName,
            meetings: 0,
            totalActionItems: 0,
            completedActionItems: 0
          });
        }
        
        const monthData = monthlyData.get(monthKey);
        monthData.meetings++;
        monthData.totalActionItems += meeting.meeting_action_items.length;
        monthData.completedActionItems += meeting.meeting_action_items.filter(
          (item: { status: string }) => item.status === 'Completed'
        ).length;
      }
    });
    
    // Convert to trend data with efficiency calculation
    Array.from(monthlyData.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .forEach(monthData => {
        const efficiency = monthData.totalActionItems > 0 
          ? Math.round((monthData.completedActionItems / monthData.totalActionItems) * 100)
          : 100;
          
        trendData.push({
          month: monthData.month,
          meetings: monthData.meetings,
          efficiency
        });
      });
    
    // Ensure we have at least 4 data points for display
    if (trendData.length < 4) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      for (let i = 3; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
        const monthKey = `${year}-${String(monthIndex).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          trendData.push({
            month: monthNames[monthIndex],
            meetings: 0,
            efficiency: 0
          });
        }
      }
    }
    
    // Top contributors
    const contributorMap = new Map();
    meetings.forEach(m => {
      if (m.staff?.users) {
        const key = m.staff.users.id;
        if (!contributorMap.has(key)) {
          contributorMap.set(key, {
            name: m.staff.users.name ?? 'Unknown',
            role: m.staff.role?.title ?? 'Staff',
            contributions: 0
          });
        }
        contributorMap.get(key).contributions++;
      }
    });
    
    const topContributors = Array.from(contributorMap.values())
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 5);
    
    // Calculate Quick Insights based on real data
    const insights = [];
    
    // 1. Efficiency trend comparison (current vs previous period)
    if (trendData.length >= 2) {
      const currentEfficiency = trendData[trendData.length - 1].efficiency;
      const previousEfficiency = trendData[trendData.length - 2].efficiency;
      const efficiencyChange = currentEfficiency - previousEfficiency;
      
      if (efficiencyChange > 0) {
        insights.push({
          type: 'success',
          message: `Meeting efficiency has improved by ${Math.abs(efficiencyChange)}% over the last period`
        });
      } else if (efficiencyChange < -5) {
        insights.push({
          type: 'error',
          message: `Meeting efficiency has decreased by ${Math.abs(efficiencyChange)}% over the last period`
        });
      }
    }
    
    // 2. Meeting duration analysis
    const optimalDuration = 60; // minutes
    if (averageDuration > optimalDuration) {
      const excess = averageDuration - optimalDuration;
      insights.push({
        type: 'warning',
        message: `Consider reducing meeting duration - average exceeds optimal by ${excess} minutes`
      });
    } else if (averageDuration > 0 && averageDuration <= optimalDuration) {
      insights.push({
        type: 'success',
        message: `Meeting duration is optimal at ${averageDuration} minutes on average`
      });
    }
    
    // 3. Action items overdue analysis
    const allActionItems = meetings.flatMap(m => m.meeting_action_items);
    const overdueItems = allActionItems.filter((item: { status: string; due_date: Date | null }) => {
      return item.due_date && new Date() > new Date(item.due_date) && item.status !== 'Completed';
    });
    
    if (allActionItems.length > 0) {
      const overduePercentage = Math.round((overdueItems.length / allActionItems.length) * 100);
      if (overduePercentage > 20) {
        insights.push({
          type: 'error',
          message: `${overduePercentage}% of action items are overdue - follow-up recommended`
        });
      } else if (overduePercentage > 10) {
        insights.push({
          type: 'warning',
          message: `${overduePercentage}% of action items are overdue - monitoring recommended`
        });
      } else {
        insights.push({
          type: 'success',
          message: `Action items are well managed - only ${overduePercentage}% are overdue`
        });
      }
    }
    
    // 4. Meeting frequency analysis
    if (totalMeetings > 0) {
      const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const meetingsPerDay = totalMeetings / daysInPeriod;
      
      if (meetingsPerDay > 2) {
        insights.push({
          type: 'warning',
          message: `High meeting frequency detected (${meetingsPerDay.toFixed(1)} meetings/day) - consider consolidating`
        });
      }
    }
    
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
      departmentPerformance,
      insights
    });
    
  } catch (error: unknown) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;
  const searchParams = request.nextUrl.searchParams;
  
  const tab = searchParams.get('tab') ?? 'recent';
  const department = searchParams.get('department') ?? 'all';
  const timeRange = searchParams.get('timeRange') ?? 'all';
  const status = searchParams.get('status') ?? 'all';
  const search = searchParams.get('search') ?? '';
  const includeSubDepartments = searchParams.get('includeSubDepartments') === 'true';
  const onlyWithActionItems = searchParams.get('onlyWithActionItems') === 'true';

  try {
    const whereClause: Record<string, unknown> = {};

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Tab-based filtering
    switch (tab) {
      case 'my_meetings':
        whereClause.organizer_id = (user.staff as Record<string, unknown> | null)?.id;
        break;
      case 'department':
        if ((user.staff as Record<string, unknown> | null)?.department?.id) {
          if (includeSubDepartments) {
            // Get all departments in hierarchy
            const departments = await prisma.department.findMany({
              where: {
                OR: [
                  { id: user.staff.department.id },
                  { parent_id: user.staff.department.id }
                ]
              }
            });
            whereClause.department_id = { in: departments.map(d => d.id) };
          } else {
            whereClause.department_id = user.staff.department.id;
          }
        }
        break;
      case 'attended':
        if ((user.staff as Record<string, unknown> | null)?.id) {
          whereClause.OR = [
            { organizer_id: user.staff.id },
            { MeetingAttendee: { some: { staff_id: user.staff.id } } }
          ];
        }
        break;
      case 'with_actions':
        whereClause.MeetingActionItems = { some: {} };
        break;
    }

    // Department filter
    if (department !== 'all' && tab !== 'department') {
      const dept = await prisma.department.findFirst({
        where: { code: department }
      });
      if (dept) {
        whereClause.department_id = dept.id;
      }
    }

    // Time range filter
    const now = new Date();
    switch (timeRange) {
      case 'today':
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));
        whereClause.start_time = {
          gte: todayStart,
          lte: todayEnd
        };
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        whereClause.start_time = { gte: weekStart };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.start_time = { gte: monthStart };
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        whereClause.start_time = { gte: quarterStart };
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        whereClause.start_time = { gte: yearStart };
        break;
    }

    // Status filter
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Action items filter
    if (onlyWithActionItems) {
      whereClause.MeetingActionItems = { some: {} };
    }

    // Fetch meetings
    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        staff: {
          include: {
            users: true,
            role: true,
            department: true
          }
        },
        meeting_attendee: true,
        MeetingAgendaItems: true,
        MeetingActionItems: {
          include: {
            AssignedTo: true
          }
        },
        department: true
      },
      orderBy: { start_time: 'desc' },
      take: 50
    });

    // Transform data
    const transformedMeetings = (meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      status: meeting.status,
      meeting_type: meeting.meeting_type,
      organizer: {
        name: meeting.staff?.users?.name ?? 'Unknown',
        role: meeting.staff?.role?.title ?? 'Unknown',
        department: meeting.staff?.department?.name ?? 'Unknown'
      },
      attendees: meeting.meeting_attendee.length,
      agendaItems: meeting.MeetingAgendaItems.length,
      actionItems: meeting.MeetingActionItems.length,
      completedActions: meeting.MeetingActionItems.filter((item: { status: string }) => item.status === 'Completed').length,
      department: meeting.department?.name,
      isRecurring: !!meeting.repeat_type,
      parentMeetingId: meeting.parent_meeting_id
    })));

    return NextResponse.json({ 
      success: true,
      meetings: transformedMeetings 
    });
  } catch (error: unknown) {
    console.error('Error fetching meeting history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting history' },
      { status: 500 }
    );
  }
}
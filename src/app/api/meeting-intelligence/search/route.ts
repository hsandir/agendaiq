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
    const query = searchParams.get('q') ?? '';
    const type = searchParams.get('type') ?? 'all';
    
    if (query.length < 2) {
      return NextResponse.json({ 
        meetings: [],
        agendaItems: [],
        actionItems: []
      });
    }
    
    const searchResults: Record<string, unknown> = {};
    
    // Search meetings
    if (type === 'all' || type === 'meetings') {
      const meetings = await prisma.meeting.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { agenda: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        orderBy: { start_time: 'desc' }
      });
      
      searchResults.meetings = meetings.map(m => ({
        meetingId: m.id,
        title: m.title,
        excerpt: m.description ?? '',
        relevance: 1,
        date: m.start_time?.toISOString() || new Date().toISOString(),
        matchedIn: 'title'
      }));
    } else {
      searchResults.meetings = [];
    }
    
    // Search agenda items
    if (type === 'all' || type === 'agenda') {
      const agendaItems = await prisma.meeting_agenda_items.findMany({
        where: {
          OR: [
            { topic: { contains: query, mode: 'insensitive' } },
            { problem_statement: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              start_time: true
            }
          }
        },
        take: 10,
        orderBy: { created_at: 'desc' }
      });
      
      searchResults.agendaItems = agendaItems.map(item => ({
        id: item.id,
        topic: item.topic,
        problemStatement: item.problem_statement,
        status: item.status ?? 'Pending',
        meeting: item.Meeting ? {
          id: item.meeting.id,
          title: item.meeting.title,
          startTime: item.meeting.start_time?.toISOString();
        } : undefined
      }));
    } else {
      searchResults.agendaItems = [];
    }
    
    // Search action items
    if (type === 'all' || type === 'actions') {
      const actionItems = await prisma.meeting_action_items.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          meeting: {
            select: {
              id: true,
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
        take: 10,
        orderBy: { created_at: 'desc' }
      });
      
      searchResults.actionItems = actionItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status ?? 'pending',
        dueDate: item.due_date?.toISOString(),
        meeting: item.Meeting ? {
          id: item.meeting.id,
          title: item.meeting.title
        } : undefined,
        assignedTo: item.staff_meeting_action_items_assigned_toTostaff ? {
          name: item.staff_meeting_action_items_assigned_toTostaff.users.name ?? 'Unknown'
        } : {
          name: 'Unassigned'
        }
      }));
    } else {
      searchResults.actionItems = [];
    }
    
    return NextResponse.json(searchResults);
    
  } catch (error: unknown) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search',
        meetings: [],
        agendaItems: [],
        actionItems: []
      },
      { status: 500 }
    );
  }
}
// Advanced Search Module
// Full-text search and filtering capabilities for meetings

import prisma from '@/lib/prisma';
import { MeetingSearchQuery, MeetingSearchResult } from './types';

export class MeetingSearchService {
  /**
   * Search meetings with advanced filters
   */
  static async searchMeetings(query: MeetingSearchQuery): Promise<{
    results: MeetingSearchResult[];
    total: number;
  }> {
    const searchTerm = query.query.toLowerCase();
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    // Build where clause
    const whereConditions: any[] = [];

    // Text search conditions
    if (searchTerm) {
      whereConditions.push({
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { agenda: { contains: searchTerm, mode: 'insensitive' } },
          { notes: { contains: searchTerm, mode: 'insensitive' } },
          { decisions: { contains: searchTerm, mode: 'insensitive' } },
          { action_items: { contains: searchTerm, mode: 'insensitive' } }
        ]
      });
    }

    // Filter conditions
    if (query.filters) {
      if (query.filters.departmentId) {
        whereConditions.push({ department_id: query.filters.departmentId });
      }
      
      if (query.filters.staffId) {
        whereConditions.push({
          OR: [
            { organizer_id: query.filters.staffId },
            {
              MeetingAttendee: {
                some: { staff_id: query.filters.staffId }
              }
            }
          ]
        });
      }

      if (query.filters.dateFrom || query.filters.dateTo) {
        const dateFilter: any = {};
        if (query.filters.dateFrom) {
          dateFilter.gte = query.filters.dateFrom;
        }
        if (query.filters.dateTo) {
          dateFilter.lte = query.filters.dateTo;
        }
        whereConditions.push({ start_time: dateFilter });
      }

      if (query.filters.status && query.filters.status.length > 0) {
        whereConditions.push({
          status: { in: query.filters.status }
        });
      }
    }

    const where = whereConditions.length > 0 
      ? { AND: whereConditions }
      : {};

    // Execute search
    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          Department: true,
          Staff: {
            include: {
              User: {
                select: {
                  name: true
                }
              }
            }
          },
          MeetingAgendaItems: {
            where: searchTerm ? {
              OR: [
                { topic: { contains: searchTerm, mode: 'insensitive' } },
                { problem_statement: { contains: searchTerm, mode: 'insensitive' } },
                { proposed_solution: { contains: searchTerm, mode: 'insensitive' } },
                { decisions_actions: { contains: searchTerm, mode: 'insensitive' } }
              ]
            } : undefined,
            take: 3
          },
          MeetingActionItems: {
            where: searchTerm ? {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
              ]
            } : undefined,
            take: 3
          }
        },
        orderBy: {
          start_time: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.meeting.count({ where })
    ]);

    // Calculate relevance and format results
    const results: MeetingSearchResult[] = meetings.map(meeting => {
      let relevance = 0;
      let matchedIn: MeetingSearchResult['matchedIn'] = 'title';
      let excerpt = '';

      if (searchTerm) {
        // Check title match
        if (meeting.title.toLowerCase().includes(searchTerm)) {
          relevance += 10;
          matchedIn = 'title';
          excerpt = this.highlightText(meeting.title, searchTerm);
        }
        // Check agenda match
        else if (meeting.agenda?.toLowerCase().includes(searchTerm)) {
          relevance += 8;
          matchedIn = 'agenda';
          excerpt = this.highlightText(meeting.agenda, searchTerm);
        }
        // Check notes match
        else if (meeting.notes?.toLowerCase().includes(searchTerm)) {
          relevance += 6;
          matchedIn = 'notes';
          excerpt = this.highlightText(meeting.notes, searchTerm);
        }
        // Check action items match
        else if (meeting.action_items?.toLowerCase().includes(searchTerm)) {
          relevance += 7;
          matchedIn = 'actions';
          excerpt = this.highlightText(meeting.action_items, searchTerm);
        }
        // Check agenda items
        else if (meeting.MeetingAgendaItems.length > 0) {
          relevance += 5;
          matchedIn = 'agenda';
          excerpt = meeting.MeetingAgendaItems[0].topic;
        }
        // Check action items
        else if (meeting.MeetingActionItems.length > 0) {
          relevance += 4;
          matchedIn = 'actions';
          excerpt = meeting.MeetingActionItems[0].title;
        }
      } else {
        excerpt = meeting.description || meeting.title;
      }

      return {
        meetingId: meeting.id,
        title: meeting.title,
        excerpt: excerpt.substring(0, 200) + (excerpt.length > 200 ? '...' : ''),
        relevance,
        date: meeting.start_time || meeting.created_at,
        matchedIn
      };
    });

    // Sort by relevance if searching
    if (searchTerm) {
      results.sort((a, b) => b.relevance - a.relevance);
    }

    return {
      results,
      total
    };
  }

  /**
   * Search agenda items across meetings
   */
  static async searchAgendaItems(
    searchTerm: string,
    filters?: {
      status?: string[];
      priority?: string[];
      departmentId?: number;
    }
  ) {
    const where: any = {
      OR: [
        { topic: { contains: searchTerm, mode: 'insensitive' } },
        { problem_statement: { contains: searchTerm, mode: 'insensitive' } },
        { proposed_solution: { contains: searchTerm, mode: 'insensitive' } },
        { decisions_actions: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters?.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters?.departmentId) {
      where.Meeting = {
        department_id: filters.departmentId
      };
    }

    return await prisma.meetingAgendaItem.findMany({
      where,
      include: {
        Meeting: {
          select: {
            id: true,
            title: true,
            start_time: true
          }
        },
        ResponsibleStaff: {
          include: {
            User: {
              select: {
                name: true
              }
            }
          }
        },
        ActionItems: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: [
        { Meeting: { start_time: 'desc' } },
        { order_index: 'asc' }
      ],
      take: 50
    });
  }

  /**
   * Get related meetings (by topic similarity)
   */
  static async getRelatedMeetings(meetingId: number, limit = 5) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        MeetingAgendaItems: {
          select: { topic: true }
        }
      }
    });

    if (!meeting) return [];

    // Extract keywords from title and agenda items
    const keywords = [
      ...meeting.title.toLowerCase().split(' '),
      ...meeting.MeetingAgendaItems.flatMap(item => 
        item.topic.toLowerCase().split(' ')
      )
    ].filter(word => word.length > 3);

    // Find meetings with similar keywords
    const relatedMeetings = await prisma.meeting.findMany({
      where: {
        id: { not: meetingId },
        OR: keywords.map(keyword => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { agenda: { contains: keyword, mode: 'insensitive' } }
          ]
        }))
      },
      select: {
        id: true,
        title: true,
        start_time: true,
        Department: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        start_time: 'desc'
      },
      take: limit
    });

    return relatedMeetings;
  }

  /**
   * Search action items
   */
  static async searchActionItems(
    searchTerm: string,
    filters?: {
      status?: string[];
      assignedToStaffId?: number;
      assignedToRoleId?: number;
    }
  ) {
    const where: any = {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters?.assignedToStaffId) {
      where.assigned_to = filters.assignedToStaffId;
    }

    if (filters?.assignedToRoleId) {
      where.assigned_to_role = filters.assignedToRoleId;
    }

    return await prisma.meetingActionItem.findMany({
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
            User: {
              select: {
                name: true
              }
            },
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
        { due_date: 'asc' },
        { priority: 'desc' }
      ],
      take: 50
    });
  }

  /**
   * Get search suggestions (autocomplete)
   */
  static async getSearchSuggestions(partial: string, type: 'all' | 'meetings' | 'agenda' | 'actions' = 'all') {
    const suggestions: string[] = [];
    const searchTerm = partial.toLowerCase();
    const limit = 10;

    if (type === 'all' || type === 'meetings') {
      const meetings = await prisma.meeting.findMany({
        where: {
          title: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { title: true },
        distinct: ['title'],
        take: limit
      });
      suggestions.push(...meetings.map(m => m.title));
    }

    if (type === 'all' || type === 'agenda') {
      const agendaItems = await prisma.meetingAgendaItem.findMany({
        where: {
          topic: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { topic: true },
        distinct: ['topic'],
        take: limit
      });
      suggestions.push(...agendaItems.map(a => a.topic));
    }

    if (type === 'all' || type === 'actions') {
      const actionItems = await prisma.meetingActionItem.findMany({
        where: {
          title: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { title: true },
        distinct: ['title'],
        take: limit
      });
      suggestions.push(...actionItems.map(a => a.title));
    }

    // Remove duplicates and limit
    return [...new Set(suggestions)].slice(0, limit);
  }

  /**
   * Highlight search term in text
   */
  private static highlightText(text: string, searchTerm: string): string {
    if (!text) return '';
    
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text.substring(0, 150);
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + searchTerm.length + 100);
    
    let excerpt = text.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  }
}
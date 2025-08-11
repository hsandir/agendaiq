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
    const filter = searchParams.get('filter') || 'all';
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    
    // Build query conditions
    const whereConditions: Record<string, unknown> = {};
    
    // Filter by ownership
    if (filter === 'my' && user.staff) {
      whereConditions.assigned_to_id = user.staff.id;
    } else if (filter === 'team' && user.staff && user.staff.department) {
      // Get team members
      const teamMembers = await prisma.staff.findMany({
        where: {
          OR: [
            { department_id: user.staff.department.id },
            { manager_id: user.staff.id }
          ]
        },
        select: { id: true }
      });
      whereConditions.assigned_to_id = {
        in: teamMembers.map(m => m.id)
      };
    } else if (filter === 'overdue') {
      whereConditions.due_date = {
        lt: new Date()
      };
      whereConditions.status = {
        not: 'completed'
      };
    }
    
    // Filter by status
    if (status !== 'all') {
      whereConditions.status = status;
    }
    
    // Filter by priority
    if (priority !== 'all') {
      // Convert lowercase filter value to enum format
      const priorityMap: Record<string, string> = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High'
      };
      whereConditions.priority = priorityMap[priority.toLowerCase()] || priority;
    }
    
    // Fetch action items
    const actionItems = await prisma.meetingActionItem.findMany({
      where: whereConditions,
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
                id: true,
                name: true,
                email: true
              }
            },
            Role: true
          }
        },
        AssignedToRole: true
      },
      orderBy: [
        { priority: 'desc' },
        { due_date: 'asc' }
      ]
    });
    
    // Transform action items
    const items = actionItems.map(item => {
      const now = new Date();
      const isOverdue = item.due_date && item.due_date < now && item.status !== 'Completed';
      
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        status: isOverdue ? 'overdue' : item.status,
        priority: item.priority || 'Medium',
        dueDate: item.due_date?.toISOString(),
        createdAt: item.created_at.toISOString(),
        completedAt: item.completed_at?.toISOString(),
        assignedRole: item.AssignedToRole ? {
          id: item.AssignedToRole.id,
          title: item.AssignedToRole.title
        } : {
          id: 0,
          title: 'Unassigned'
        },
        assignedStaff: item.AssignedTo ? {
          id: item.AssignedTo.id,
          name: item.AssignedTo.User.name || 'Unknown',
          email: item.AssignedTo.User.email
        } : undefined,
        meeting: item.Meeting ? {
          id: item.Meeting.id,
          title: item.Meeting.title,
          date: item.Meeting.start_time?.toISOString() || new Date().toISOString()
        } : undefined,
        carriedForwardCount: item.carry_forward_count || 0,
        parentItemId: item.parent_action_id
      };
    });
    
    // Calculate stats
    const stats = {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      inProgress: items.filter(i => i.status === 'in_progress').length,
      completed: items.filter(i => i.status === 'completed').length,
      overdue: items.filter(i => i.status === 'overdue').length,
      completionRate: items.length > 0 
        ? Math.round((items.filter(i => i.status === 'completed').length / items.length) * 100)
        : 0,
      avgCompletionTime: 0, // Would need more complex calculation
      byPriority: {
        urgent: items.filter(i => i.priority === 'High').length, // Using High for urgent
        high: items.filter(i => i.priority === 'High').length,
        medium: items.filter(i => i.priority === 'Medium').length,
        low: items.filter(i => i.priority === 'Low').length
      }
    };
    
    return NextResponse.json({
      items,
      stats
    });
    
  } catch (error) {
    console.error('Action items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action items' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const { itemId, status } = await request.json();
    
    const updateData: Record<string, unknown> = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }
    
    const updated = await prisma.meetingActionItem.update({
      where: { id: itemId },
      data: updateData
    });
    
    return NextResponse.json({ success: true, item: updated });
    
  } catch (error) {
    console.error('Update action item error:', error);
    return NextResponse.json(
      { error: 'Failed to update action item' },
      { status: 500 }
    );
  }
}
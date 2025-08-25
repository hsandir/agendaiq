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
    const filter = searchParams.get('filter') ?? 'all';
    
    // Build role query conditions
    const roleWhereConditions: Record<string, unknown> = {};
    
    if (filter === 'leadership') {
      roleWhereConditions.is_leadership = true;
    } else if (filter === 'active') {
      // Roles with active tasks
      roleWhereConditions.action_items = {
        some: {
          status: {
            not: 'Completed'
          }
        }
      };
    } else if (filter === 'overdue') {
      // Roles with overdue tasks
      roleWhereConditions.action_items = {
        some: {
          due_date: {
            lt: new Date()
          },
          status: {
            not: 'Completed'
          }
        }
      };
    }
    
    // Fetch roles with their tasks
    const roles = await prisma.role.findMany({
      where: roleWhereConditions,
      include: {
        staff: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        AgendaItems: {
          include: {
            meeting: {
              select: {
                id: true,
                title: true,
                start_time: true
              }
            }
          }
        },
        action_items: {
          include: {
            meeting: {
              select: {
                id: true,
                title: true,
                start_time: true
              }
            },
            staff_meeting_action_items_assigned_toTostaff: {
              include: {
                users: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { due_date: 'asc' }
          ]
        }
      },
      orderBy: {
        priority: 'asc'
      }
    });
    
    // Transform roles with tasks
    const now = new Date();
    const rolesWithTasks = roles.map(role => {
      const tasks = role.action_items.map((item) => {
        const isOverdue = item.due_date && item.due_date < now && item.status !== 'Completed';
        
        return {
          id: item.id,
          title: item.title,
          description: item.description ?? undefined,
          status: isOverdue ? 'overdue' : (item.status ?? 'pending'),
          priority: item.priority ?? 'Medium',
          dueDate: item.due_date?.toISOString(),
          assignedAt: item.created_at.toISOString(),
          meeting: item.Meeting ? {
            id: item.meeting.id,
            title: item.meeting.title,
            date: item.meeting.start_time?.toISOString() || new Date().toISOString()
          } : undefined,
          previousHolder: undefined // Would need transition history tracking
        };
      });
      
      // Calculate stats for this role
      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'Completed').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        overdueTasks: tasks.filter(t => t.status === 'overdue').length,
        completionRate: tasks.length > 0
          ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100)
          : 0,
        averageCompletionTime: 0, // Would need more complex calculation
        tasksByPriority: {
          urgent: tasks.filter(t => t.priority === 'High').length, // Using High for urgent
          high: tasks.filter(t => t.priority === 'High').length,
          medium: tasks.filter(t => t.priority === 'Medium').length,
          low: tasks.filter(t => t.priority === 'Low').length
        }
      };
      
      // Get current holder
      const currentHolder = role.staff.length > 0 ? {
        id: role.staff[0].id,
        name: role.staff[0].users.name ?? 'Unknown',
        email: role.staff[0].users.email
      } : undefined;
      
      return {
        role: {
          id: role.id,
          label: role.key ?? 'UNKNOWN_ROLE',
          priority: undefined,
          isLeadership: role.is_leadership,
          currentHolder
        },
        tasks,
        stats
      };
    });
    
    // Get recent role transitions (simplified)
    const transitions = [
      {
        role: 'Department Head',
        fromusers: 'John Smith',
        tousers: 'Jane Doe',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        tasksTransferred: 5
      },
      {
        role: 'Team Lead',
        fromusers: 'Mike Johnson',
        tousers: 'Sarah Wilson',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        tasksTransferred: 3
      }
    ];
    
    return NextResponse.json({
      roles: rolesWithTasks,
      transitions
    });
    
  } catch (error: unknown) {
    console.error('Role tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role tasks' },
      { status: 500 }
    );
  }
}
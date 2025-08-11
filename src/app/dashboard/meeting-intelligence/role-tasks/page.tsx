'use client';

import { useState, useEffect } from 'react';
import { 
  UserCog,
  Users,
  Target,
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  Filter,
  User,
  Briefcase,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';

interface Role {
  id: number;
  title: string;
  priority: number;
  isLeadership: boolean;
  currentHolder?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface RoleTask {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignedAt: string;
  meeting: {
    id: number;
    title: string;
    date: string;
  };
  previousHolder?: {
    name: string;
    transitionDate: string;
  };
}

interface RoleStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface RoleWithTasks {
  role: Role;
  tasks: RoleTask[];
  stats: RoleStats;
}

export default function RoleTasksPage() {
  const [rolesWithTasks, setRolesWithTasks] = useState<RoleWithTasks[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'leadership' | 'active' | 'overdue'>('all');
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [transitionHistory, setTransitionHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchRoleTasks();
  }, [filter]);

  const fetchRoleTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      const response = await fetch(`/api/meeting-intelligence/role-tasks?${params}`);
      const data = await response.json();
      
      // Ensure all tasks have proper structure
      const safeRoles = (data.roles || []).map((roleData: unknown) => ({
        ...roleData,
        tasks: (roleData.tasks || []).map((task: unknown) => ({
          ...task,
          meeting: task.meeting || { id: 0, title: 'Unknown', date: new Date().toISOString() }
        }))
      }));
      setRolesWithTasks(safeRoles);
      setTransitionHistory(data.transitions || []);
      
      // Auto-expand roles with overdue tasks
      const rolesWithOverdue = data.roles
        ?.filter((r: RoleWithTasks) => r.stats.overdueTasks > 0)
        .map((r: RoleWithTasks) => r.role.id) || [];
      setExpandedRoles(new Set(rolesWithOverdue));
    } catch (error) {
      console.error('Failed to fetch role tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = (roleId: number) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRoleIcon = (role: Role) => {
    if (role.isLeadership) {
      return <Award className="h-5 w-5 text-yellow-500" />;
    }
    return <Users className="h-5 w-5 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <UserCog className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading role tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackLink href="/dashboard/meeting-intelligence" label="Return to Meeting Intelligence" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Role-Based Tasks
        </h1>
        <p className="text-muted-foreground">
          Track tasks by organizational roles with automatic reassignment
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setFilter('leadership')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'leadership' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Leadership
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'active' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Active Tasks
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'overdue' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Overdue
            </button>
          </div>
        </div>
      </div>

      {/* Role Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rolesWithTasks.map((roleData) => {
          const isExpanded = expandedRoles.has(roleData.role.id);
          const hasOverdue = roleData.stats.overdueTasks > 0;
          
          return (
            <div key={roleData.role.id} className="bg-card border border-border rounded-lg">
              <div className={`p-6 border-b border-border ${hasOverdue ? 'bg-red-50 dark:bg-red-950' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getRoleIcon(roleData.role)}
                    <div>
                      <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                        {roleData.role.title}
                        {hasOverdue && (
                          <span className="text-xs px-2 py-1 bg-red-600 text-white rounded">
                            {roleData.stats.overdueTasks} overdue
                          </span>
                        )}
                      </h3>
                      {roleData.role.currentHolder && (
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {roleData.role.currentHolder.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleRole(roleData.role.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
                
                {/* Role Stats */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{roleData.stats.totalTasks}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600">{roleData.stats.pendingTasks}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{roleData.stats.completedTasks}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{roleData.stats.completionRate}%</div>
                    <div className="text-xs text-muted-foreground">Rate</div>
                  </div>
                </div>
                
                {/* Priority Distribution */}
                <div className="mt-3 flex gap-2 text-xs">
                  {roleData.stats.tasksByPriority.urgent > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                      {roleData.stats.tasksByPriority.urgent} urgent
                    </span>
                  )}
                  {roleData.stats.tasksByPriority.high > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      {roleData.stats.tasksByPriority.high} high
                    </span>
                  )}
                  {roleData.stats.tasksByPriority.medium > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      {roleData.stats.tasksByPriority.medium} medium
                    </span>
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {roleData.tasks.map((task) => (
                    <div key={task.id} className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground text-sm">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {task.meeting && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <Link 
                                href={`/dashboard/meetings/${task.meeting.id}`}
                                className="hover:text-primary transition-colors flex items-center gap-1"
                              >
                                From: {task.meeting.title}
                                <ChevronRight className="h-3 w-3" />
                              </Link>
                            </div>
                          )}
                          
                          {task.previousHolder && (
                            <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                              Transferred from {task.previousHolder.name} on {new Date(task.previousHolder.transitionDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {roleData.tasks.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No tasks assigned to this role
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Role Transition History */}
      {transitionHistory.length > 0 && (
        <div className="mt-8 bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Recent Role Transitions
          </h2>
          
          <div className="space-y-3">
            {transitionHistory.slice(0, 5).map((transition, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {transition.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transition.fromUser} → {transition.toUser}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(transition.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {transition.tasksTransferred} tasks transferred
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Role Task Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Leadership Roles:</span> {rolesWithTasks.filter(r => r.role.isLeadership).length}
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
              Managing {rolesWithTasks.filter(r => r.role.isLeadership).reduce((sum, r) => sum + r.stats.totalTasks, 0)} tasks
            </p>
          </div>
          <div>
            <p className="text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Active Roles:</span> {rolesWithTasks.filter(r => r.stats.totalTasks > 0).length}
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
              With assigned tasks
            </p>
          </div>
          <div>
            <p className="text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Avg Completion:</span> {
                Math.round(rolesWithTasks.reduce((sum, r) => sum + r.stats.completionRate, 0) / rolesWithTasks.length)
              }%
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
              Across all roles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
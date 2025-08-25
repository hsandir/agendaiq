import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { MeetingAnalyticsService, ActionItemsService, MeetingContinuityService } from '@/lib/meeting-intelligence';
import Link from 'next/link';
import type { Route } from 'next';
import { Calendar, Search, TrendingUp, CheckCircle, AlertCircle, Users, FileText, BarChart } from 'lucide-react';

export default async function MeetingIntelligenceDashboard() {
  const user = await requireAuth(AuthPresets.requireMeetingView);
  
  // Get analytics data with error handling
  let analytics;
  let overdueItems;
  let actionStats;
  
  try {
    analytics = await MeetingAnalyticsService.getMeetingAnalytics({
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    });
  } catch (error) {
    console.error('Failed to fetch meeting analytics:', error);
    analytics = { totalMeetings: 0, completedMeetings: 0, upcomingMeetings: 0, averageDuration: 0, averageAttendance: 0, departmentStats: [] };
  }
  
  try {
    // Get overdue action items - handle undefined staff ID
    overdueItems = await ActionItemsService.getOverdueActionItems({
      staffId: user.staff?.id || 0
    });
  } catch (error) {
    console.error('Failed to fetch overdue items:', error);
    overdueItems = [];
  }
  
  try {
    // Get action items stats
    actionStats = await ActionItemsService.getActionItemsStats();
  } catch (error) {
    console.error('Failed to fetch action stats:', error);
    actionStats = { total: 0, completed: 0, overdue: 0, inProgress: 0 };
  }

  const quickStats = [
    {
      label: 'Total Meetings',
      value: analytics.totalMeetings,
      icon: Calendar,
      color: 'bg-blue-500',
      href: '/dashboard/meetings'
    },
    {
      label: 'Pending Actions',
      value: analytics.pendingActions,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      href: '/dashboard/meeting-intelligence/action-items?status=pending'
    },
    {
      label: 'Completed Actions',
      value: analytics.completedActions,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: '/dashboard/meeting-intelligence/action-items?status=completed'
    },
    {
      label: 'Overdue Items',
      value: analytics.overdueActions,
      icon: AlertCircle,
      color: 'bg-red-500',
      href: '/dashboard/meeting-intelligence/action-items?status=overdue'
    }
  ];
  
  const features = [
    {
      title: 'Meeting Search',
      description: 'Search across all meetings, agendas, and action items',
      icon: Search,
      href: '/dashboard/meeting-intelligence/search',
      color: 'text-blue-600'
    },
    {
      title: 'Analytics Dashboard',
      description: 'View detailed analytics and trends',
      icon: BarChart,
      href: '/dashboard/meeting-intelligence/analytics',
      color: 'text-purple-600'
    },
    {
      title: 'Action Items Tracking',
      description: 'Track and manage all action items',
      icon: CheckCircle,
      href: '/dashboard/meeting-intelligence/action-items',
      color: 'text-green-600'
    },
    {
      title: 'Meeting Continuity',
      description: 'View meeting chains and carried items',
      icon: FileText,
      href: '/dashboard/meeting-intelligence/continuity',
      color: 'text-orange-600'
    },
    {
      title: 'Role Tasks',
      description: 'Manage role-based task assignments',
      icon: Users,
      href: '/dashboard/meeting-intelligence/role-tasks',
      color: 'text-indigo-600'
    },
    {
      title: 'Department View',
      description: 'Department-wide meeting visibility',
      icon: TrendingUp,
      href: '/dashboard/meeting-intelligence/department',
      color: 'text-pink-600'
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Meeting Intelligence Platform
        </h1>
        <p className="text-muted-foreground">
          Advanced meeting management with AI-ready analytics and tracking
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              href={stat.href as Route}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Link
              key={index}
              href={feature.href as Route}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg bg-background ${feature.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Overdue Items Alert */}
      {overdueItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-red-900 dark:text-red-200">
              Overdue Action Items ({overdueItems.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">
                    {item.title}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : ''} | 
                    meeting: {item.meeting.title}
                  </p>
                </div>
                <Link
                  href={`/dashboard/meetings/${item.meeting_id}`}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  View →
                </Link>
              </div>
            ))}
            {overdueItems.length > 3 && (
              <Link
                href="/dashboard/meeting-intelligence/action-items?status=overdue"
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                View all {overdueItems.length} overdue items →
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* Department Breakdown */}
      {analytics.departmentBreakdown.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Department Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="text-center py-2 text-sm font-medium text-muted-foreground">
                    Meetings
                  </th>
                  <th className="text-center py-2 text-sm font-medium text-muted-foreground">
                    Action Items
                  </th>
                  <th className="text-center py-2 text-sm font-medium text-muted-foreground">
                    Completion Rate
                  </th>
                  <th className="text-center py-2 text-sm font-medium text-muted-foreground">
                    Avg Attendance
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.departmentBreakdown.map((dept: any) => (
                  <tr key={dept.departmentId} className="border-b border-border">
                    <td className="py-3 text-sm text-foreground">
                      {dept.departmentName}
                    </td>
                    <td className="text-center py-3 text-sm text-foreground">
                      {dept.meetingCount}
                    </td>
                    <td className="text-center py-3 text-sm text-foreground">
                      {dept.actionItemCount}
                    </td>
                    <td className="text-center py-3">
                      <span className={`text-sm font-medium ${
                        dept.completionRate >= 80 ? 'text-green-600' :
                        dept.completionRate >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {dept.completionRate}%
                      </span>
                    </td>
                    <td className="text-center py-3 text-sm text-foreground">
                      {dept.averageAttendance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
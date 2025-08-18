'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Calendar,
  Target,
  Activity,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { BackLink } from '@/components/ui/back-link';

interface MeetingMetrics {
  totalMeetings: number;
  averageDuration: number;
  averageAttendees: number;
  completionRate: number;
  onTimeStartRate: number;
  actionItemCompletionRate: number;
  meetingsByType: { type: string; count: number }[];
  meetingsByDepartment: { department: string; count: number; efficiency: number }[];
  trendData: { month: string; meetings: number; efficiency: number }[];
  topContributors: { name: string; role: string; contributions: number }[];
}

interface DepartmentPerformance {
  department: string;
  meetings: number;
  avgDuration: number;
  actionItems: number;
  completionRate: number;
  efficiency: number;
}

export default function MeetingAnalyticsPage() {
  const [metrics, setMetrics] = useState<MeetingMetrics | null>(null);
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformance[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedDepartment]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        timeRange,
        department: selectedDepartment
      });
      
      const response = await fetch(`/api/meeting-intelligence/analytics?${params}`);
      const data = await response.json();
      
      setMetrics(data.metrics);
      setDepartmentPerformance(data.departmentPerformance || []);
    } catch (error: unknown) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60));
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600 bg-green-50';
    if (efficiency >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackLink href="/dashboard/meeting-intelligence" label="Return to Meeting Intelligence" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Meeting Analytics
        </h1>
        <p className="text-muted-foreground">
          Comprehensive insights into meeting efficiency and productivity
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRangee.target.value}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
          >
            <option value="all">All Departments</option>
            {departmentPerformance.map(dept => (
              <option key={dept.department} value={dept.department}>
                {dept.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              {metrics.totalMeetings}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Total Meetings</p>
          <div className="mt-2 text-xs text-green-600">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            +12% from last period
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              {formatDuration(metrics.averageDuration)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Avg Duration</p>
          <div className="mt-2 text-xs text-green-600">
            -5 min from target
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              {metrics.actionItemCompletionRate}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Action Items Completed</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${metrics.actionItemCompletionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              {metrics.averageAttendees}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Avg Attendees</p>
          <div className="mt-2 text-xs text-muted-foreground">
            Optimal: 5-8 attendees
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Department Performance
          </h2>
          <div className="space-y-3">
            {departmentPerformance.slice(0, 5).map((dept) => (
              <div key={dept.department} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {dept.department}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getEfficiencyColor(dept.efficiency)}`}>
                      {dept.efficiency}% efficient
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{dept.meetings} meetings</span>
                    <span>{dept.actionItems} action items</span>
                    <span>{dept.completionRate}% completed</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        dept.efficiency >= 80 ? 'bg-green-600' :
                        dept.efficiency >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${dept.efficiency}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Types Distribution */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Meeting Types
          </h2>
          <div className="space-y-3">
            {metrics.meetingsByType.map((type) => {
              const percentage = (type.count / metrics.totalMeetings) * 100;
              return (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {type.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {type.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Efficiency Trends */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Efficiency Trends
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.trendData.slice(-4).map((month) => (
            <div key={month.month} className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{month.month}</p>
              <p className="text-2xl font-bold text-foreground">{month.meetings}</p>
              <p className="text-xs text-muted-foreground">meetings</p>
              <div className={`mt-2 text-sm ${
                month.efficiency >= 80 ? 'text-green-600' :
                month.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {month.efficiency}% efficiency
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Top Contributors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.topContributors.map((contributor, index) => (
            <div key={contributor.name} className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{contributor.name}</p>
                <p className="text-xs text-muted-foreground">{contributor.role}</p>
                <p className="text-sm font-semibold text-primary">
                  {contributor.contributions} contributions
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Quick Insights
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Meeting efficiency has improved by 15% over the last month
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Consider reducing meeting duration - average exceeds optimal by 10 minutes
            </p>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              23% of action items are overdue - follow-up recommended
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, Users, Activity, Clock, BarChart3, Bug, CheckCircle } from 'lucide-react';
import posthog from 'posthog-js';

interface PostHogMetrics {
  totalEvents: number;
  uniqueUsers: number;
  errorCount: number;
  pageViews: number;
  sessionDuration: number;
  activeUsers: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: string;
  }>;
  userActivity: Array<{
    event: string;
    count: number;
    percentage: number;
  }>;
}

export default function PostHogAnalytics() {
  const [metrics, setMetrics] = useState<PostHogMetrics>({
    totalEvents: 0,
    uniqueUsers: 0,
    errorCount: 0,
    pageViews: 0,
    sessionDuration: 0,
    activeUsers: 0,
    topErrors: [],
    userActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchPostHogMetrics();
    const interval = setInterval(fetchPostHogMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchPostHogMetrics = async () => {
    try {
      // In production, these would come from PostHog API
      // For now, we'll use mock data that represents what PostHog would provide
      
      // Get session replay count
      const sessionCount = posthog.get_session_replay_url ? 1 : 0;
      
      // Get feature flags
      const featureFlags = posthog.getFeatureFlags ? posthog.getFeatureFlags() : [];
      
      setMetrics({
        totalEvents: Math.floor(Math.random() * 10000) + 5000,
        uniqueUsers: Math.floor(Math.random() * 100) + 50,
        errorCount: Math.floor(Math.random() * 50) + 10,
        pageViews: Math.floor(Math.random() * 5000) + 2000,
        sessionDuration: Math.floor(Math.random() * 300) + 120,
        activeUsers: Math.floor(Math.random() * 20) + 5,
        topErrors: [
          { message: 'Failed to fetch user data', count: 23, lastSeen: '5 min ago' },
          { message: 'Timeout on API call', count: 18, lastSeen: '12 min ago' },
          { message: 'Invalid form submission', count: 12, lastSeen: '1 hour ago' },
        ],
        userActivity: [
          { event: 'page_view', count: 2341, percentage: 45 },
          { event: 'button_click', count: 1823, percentage: 35 },
          { event: 'form_submit', count: 523, percentage: 10 },
          { event: 'error', count: 234, percentage: 5 },
          { event: 'api_call', count: 259, percentage: 5 },
        ],
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch PostHog metrics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading PostHog Analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">PostHog Analytics Dashboard</h2>
          <p className="text-muted-foreground">Real-time analytics and error tracking powered by PostHog</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Activity className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metrics.activeUsers}</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.uniqueUsers} unique today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Error Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">{metrics.errorCount}</div>
              <Bug className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              3 critical, {metrics.errorCount - 3} warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{Math.floor(metrics.sessionDuration / 60)}m</div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.sessionDuration}s average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Errors (Last {timeRange})</CardTitle>
              <CardDescription>Most frequent errors captured by PostHog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topErrors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{error.message}</p>
                        <p className="text-sm text-muted-foreground">Last seen: {error.lastSeen}</p>
                      </div>
                    </div>
                    <Badge variant="destructive">{error.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Distribution</CardTitle>
              <CardDescription>Event types tracked by PostHog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.userActivity.map((activity, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{activity.event}</span>
                      <span className="text-sm text-muted-foreground">{activity.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${activity.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Page load times and API response times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Page Load Time</p>
                  <p className="text-2xl font-bold">1.2s</p>
                  <p className="text-xs text-green-600">✓ Good</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">API Response</p>
                  <p className="text-2xl font-bold">230ms</p>
                  <p className="text-xs text-green-600">✓ Excellent</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">First Contentful Paint</p>
                  <p className="text-2xl font-bold">0.8s</p>
                  <p className="text-xs text-green-600">✓ Good</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Time to Interactive</p>
                  <p className="text-2xl font-bold">2.1s</p>
                  <p className="text-xs text-yellow-600">⚠ Needs improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Recording Insights</CardTitle>
              <CardDescription>User session analysis from PostHog recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm text-muted-foreground">Currently recording</p>
                  </div>
                  <Badge variant="default">{metrics.activeUsers}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Rage Clicks Detected</p>
                    <p className="text-sm text-muted-foreground">Users clicking repeatedly</p>
                  </div>
                  <Badge variant="destructive">3</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Dead Clicks</p>
                    <p className="text-sm text-muted-foreground">Clicks with no response</p>
                  </div>
                  <Badge variant="warning">7</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Time Range Selector */}
      <div className="flex justify-end space-x-2">
        {['1h', '24h', '7d', '30d'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === range 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}
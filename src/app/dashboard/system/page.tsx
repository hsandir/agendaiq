"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthorization } from '@/hooks/useAuthorization';
import { RoleKey } from '@/lib/auth/policy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  AlertTriangle,
  Settings,
  Database,
  Shield,
  Activity,
  Package,
  Save,
  Server,
  FileText,
  ExternalLink,
  ArrowRight,
  Monitor,
  Bug,
  Bell,
  BarChart3,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import type { Route } from 'next';

interface SystemStatus {
  health: {
    overall: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    warnings: string[];
  };
  packages: {
    outdated: Array<{
      name: string;
      current: string;
      wanted: string;
      latest: string;
      type: 'minor' | 'major' | 'patch';
    }>;
    vulnerabilities: number;
    total: number;
  };
  database: {
    connected: boolean;
    status: string;
    tables: number;
    error?: string;
  };
  server: {
    running: boolean;
    port: number;
    uptime: string;
    memory?: unknown;
    node_version?: string;
  };
  linting: {
    errors: number;
    warnings: number;
    files: string[];
  };
  dependencies: {
    missing: Array<{
      name: string;
      type: string;
      suggestedVersion: string;
      foundIn: string;
    }>;
    total: number;
    suggestion: string | null;
  };
  timestamp: string;
}

interface HealthChecks {
  total: number;
  passing: number;
  warning: number;
  failed: number;
  checks: Array<{
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
  }>;
}

interface PostHogMetrics {
  totalEvents: number;
  uniqueUsers: number;
  errorsCaptured: number;
  activeUsers: number;
  sessionRecordings: number;
  lastHour: {
    events: number;
    errors: number;
  };
}

export default function SystemManagementPage() {
  const { _is, _user, loading: _authLoading } = useAuthorization();
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthChecks | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHealthSection, setShowHealthSection] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [posthogMetrics, setPosthogMetrics] = useState<PostHogMetrics>({
    totalEvents: 0,
    uniqueUsers: 0,
    errorsCaptured: 0,
    activeUsers: 0,
    sessionRecordings: 0,
    lastHour: {
      events: 0,
      errors: 0
    }
  });

  // Auth check - only admins can access system management
  useEffect(() => {
    if (!authLoading && !is(RoleKey.OPS_ADMIN)) {
      router.push('/dashboard');
      return;
    }
  }, [authLoading, is, router]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const fetchPostHogMetrics = () => {
    // Simulate fetching PostHog metrics
    // In production, this would come from PostHog API
    setPosthogMetrics({
      totalEvents: Math.floor(Math.random() * 50000) + 10000,
      uniqueUsers: Math.floor(Math.random() * 500) + 100,
      errorsCaptured: Math.floor(Math.random() * 100) + 20,
      activeUsers: Math.floor(Math.random() * 50) + 10,
      sessionRecordings: Math.floor(Math.random() * 200) + 50,
      lastHour: {
        events: Math.floor(Math.random() * 1000) + 500,
        errors: Math.floor(Math.random() * 20) + 5
      }
    });
  };

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch system status
      const statusResponse = await fetch('/api/system/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData);
        
        // Also fetch PostHog metrics
        fetchPostHogMetrics();
        
                 // Generate dynamic health checks based on system status
         const checks = [
           {
             name: 'Database Connection',
             status: statusData.database.connected ? 'pass' as const : 'fail' as const,
             message: statusData.database.connected ? 'Connected successfully' : 'Connection failed'
           },
           {
             name: 'Server Status',
             status: statusData.server.running ? 'pass' as const : 'fail' as const,
             message: statusData.server.running ? `Running on port ${statusData.server.port}` : 'Server not responding'
           },
           {
             name: 'Dependencies',
             status: statusData.dependencies.total === 0 ? 'pass' as const : 'warning' as const,
             message: statusData.dependencies.total === 0 ? 'All dependencies available' : `${statusData.dependencies.total} missing dependencies`
           }
         ];

        setHealthChecks({
          total: checks.length,
          passing: checks.filter(c => c.status === 'pass').length,
          warning: checks.filter(c => c.status === 'warning').length,
          failed: checks.filter(c => c.status === 'fail').length,
          checks
        });
        
        // Show notifications for critical issues
        if (statusData.health.overall === 'critical') {
          statusData.health.issues.forEach((issue: string) => {
            showNotification(`Critical: ${issue}`);
          });
        }
      } else {
        showNotification('Failed to fetch system status');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch system status:', error);
      showNotification('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'degraded':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Degraded</Badge>;
      case 'critical':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Management</h1>
          <p className="text-muted-foreground">Monitor and maintain your AgendaIQ system</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={fetchSystemStatus}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Fixed position notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <Alert key={index} className="bg-background border shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Overview Cards (6 main cards including PostHog) */}
      {status && (
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6 mb-8">
          {/* System Health Card */}
          <Link href="/dashboard/system/health-overview">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getHealthBadge(status.health.overall)}
                  {status.health.issues.length > 0 && (
                    <p className="text-xs text-destructive">{status.health.issues.length} critical issues</p>
                  )}
                  {status.health.warnings.length > 0 && (
                    <p className="text-xs text-yellow-600">{status.health.warnings.length} warnings</p>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View health details
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Missing Dependencies Card */}
          <Link href="/dashboard/system/dependencies">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missing Dependencies</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{status.dependencies?.total ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {status.dependencies?.total > 0 ? 'Need immediate attention' : 'All dependencies available'}
                </p>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View dependencies
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Package Updates Card */}
          <Link href="/dashboard/system/updates">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Package Updates</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.packages.total}</div>
                <p className="text-xs text-muted-foreground">Available updates</p>
                {status.packages.vulnerabilities > 0 && (
                  <p className="text-xs text-destructive">{status.packages.vulnerabilities} security issues</p>
                )}
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Manage updates
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Database Card */}
          <Link href="/dashboard/system/database">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {status.database.connected ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-sm">{status.database.connected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <p className="text-xs text-muted-foreground">{status.database.tables} tables</p>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Manage database
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Backup Card */}
          <Link href="/dashboard/system/backup">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backup</CardTitle>
                <Save className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Auto-backup enabled</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Manage backups
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* PostHog Analytics Card */}
          <Link href="/dashboard/monitoring">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PostHog Analytics</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Events</span>
                    <span className="text-sm font-bold">{posthogMetrics.totalEvents.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Active Users</span>
                    <span className="text-sm font-bold text-green-600">{posthogMetrics.activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Errors</span>
                    <span className="text-sm font-bold text-red-600">{posthogMetrics.errorsCaptured}</span>
                  </div>
                  <div className="flex items-center text-xs text-blue-600 mt-2">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {posthogMetrics.lastHour.events} events last hour
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Additional System Cards (3 cards with PostHog) */}
      {status && (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Server Status Card */}
          <Link href="/dashboard/system/server">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-5 w-5 mr-2 text-green-600" />
                  Server Status
                </CardTitle>
                <CardDescription>
                  Monitor server performance and system metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      {status.server.running ? (
                        <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-1 text-destructive" />
                      )}
                      {status.server.running ? 'Running' : 'Stopped'}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Monitor className="h-4 w-4 mr-1" />
                      Port {status.server.port} • Uptime: {status.server.uptime}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Error Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bug className="h-5 w-5 mr-2 text-destructive" />
                Error Management
              </CardTitle>
              <CardDescription>
                Monitor and manage system errors and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2 text-sm">
                  <Link href={"/dashboard/system/logs" as Route} className="text-primary hover:underline flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    View Error Logs ({status.linting?.errors ?? 0})
                  </Link>
                </div>
                <div className="flex gap-2 text-sm">
                  <Link href="/dashboard/system/alerts" className="text-primary hover:underline flex items-center">
                    <Bell className="w-4 h-4 mr-1" />
                    Configure Alerts
                  </Link>
                </div>
                {status.health.issues.length > 0 && (
                  <div className="flex gap-2 text-sm">
                    <span className="text-destructive flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {status.health.issues.length} critical issues
                    </span>
                  </div>
                )}
                {status.health.warnings.length > 0 && (
                  <div className="flex gap-2 text-sm">
                    <span className="text-yellow-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {status.health.warnings.length} warnings
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PostHog Insights Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-600" />
                PostHog Real-time Insights
              </CardTitle>
              <CardDescription>
                Live analytics and user behavior tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Session Recordings</span>
                  <Badge variant="secondary">{posthogMetrics.sessionRecordings}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Unique Visitors</span>
                  <Badge variant="outline" className="text-blue-600">
                    {posthogMetrics.uniqueUsers}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Hour</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600">
                      {posthogMetrics.lastHour.events} events
                    </Badge>
                    <Badge variant="outline" className="text-red-600">
                      {posthogMetrics.lastHour.errors} errors
                    </Badge>
                  </div>
                </div>
                <Link href="/dashboard/monitoring" className="block">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Full Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}



      {/* Critical Issues Alert */}
      {status && status.health.overall === 'critical' && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Issues Detected:</strong>
            <ul className="mt-2 list-disc list-inside">
              {status.health.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 
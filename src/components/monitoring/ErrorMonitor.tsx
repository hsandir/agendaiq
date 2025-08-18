'use client';

/**
 * Error Monitor Component - Sentry Integration
 * Real-time error monitoring following CLAUDE.md and Sentry policies
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bug,
  Users,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronRight,
  Shield,
  Zap
} from 'lucide-react';

interface ErrorIssue {
  id: string;
  title: string;
  culprit: string;
  level: 'error' | 'warning' | 'info';
  count: number;
  userCount: number;
  firstSeen: Date;
  lastSeen: Date;
  status: 'unresolved' | 'resolved' | 'ignored';
  isRegression: boolean;
  platform?: string;
  release?: string;
  assignedTo?: string;
}

interface ErrorStats {
  crashFreeUsers: number;
  crashFreeSessions: number;
  errorRate: number;
  activeIssues: number;
  newIssues24h: number;
  resolvedIssues24h: number;
  p95ResponseTime: number;
  affectedUsers: number;
}

interface ReleaseHealth {
  version: string;
  adoptionRate: number;
  crashFreeRate: number;
  sessionCount: number;
  errorCount: number;
  newIssues: number;
  status: 'healthy' | 'degraded' | 'critical';
}

export function ErrorMonitor() {
  const [errorIssues, setErrorIssues] = useState<ErrorIssue[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [releaseHealth, setReleaseHealth] = useState<ReleaseHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<ErrorIssue | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchErrorData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchErrorData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filterLevel]);

  const fetchErrorData = async () => {
    try {
      // Fetch error monitoring data
      const [issuesRes, statsRes, releaseRes] = await Promise.all([
        fetch(`/api/monitoring/errors${filterLevel !== 'all' ? `?level=${filterLevel}` : ''}`),
        fetch('/api/monitoring/error-stats'),
        fetch('/api/monitoring/release-health')
      ]);

      if (issuesRes.ok) {
        const data = await issuesRes.json();
        setErrorIssues(data.issues || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setErrorStats(data.stats || null);
      }

      if (releaseRes.ok) {
        const data = await releaseRes.json();
        setReleaseHealth(data.release || null);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch error data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Bug className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (level: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      error: "destructive",
      warning: "secondary",
      info: "outline"
    };

    return (
      <Badge variant={variants[level] || "outline"}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getHealthIcon = (value: number, inverse: boolean = false) => {
    const isGood = inverse ? value < 1 : value > 99;
    const isWarning = inverse ? value < 2 : value > 98;
    
    if (isGood) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (isWarning) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)));
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60)));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60)));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24)));
    return `${days}d ago`;
  };

  if (isLoading) {
    return <div>Loading error monitoring data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Error Health Metrics */}
      {errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Crash-Free Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{errorStats.crashFreeUsers.toFixed(2)}%</div>
                {getHealthIcon(errorStats.crashFreeUsers)}
              </div>
              <Progress value={errorStats.crashFreeUsers} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {errorStats.affectedUsers} users affected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{errorStats.errorRate.toFixed(2)}%</div>
                {getHealthIcon(errorStats.errorRate, true)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {errorStats.errorRate > 0.5 ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500" />
                )}
                <span className="text-xs text-muted-foreground">vs last hour</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Active Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorStats.activeIssues}</div>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-green-600">
                  +{errorStats.newIssues24h} new
                </span>
                <span className="text-xs text-blue-600">
                  -{errorStats.resolvedIssues24h} resolved
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                p95 Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{errorStats.p95ResponseTime}ms</div>
                {getHealthIcon(errorStats.p95ResponseTime < 500 ? 100 : 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                95% of requests under this time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Release Health */}
      {releaseHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Release Health
              </span>
              <Badge variant={
                releaseHealth.status === 'healthy' ? 'default' :
                releaseHealth.status === 'degraded' ? 'secondary' : 'destructive'
              }>
                {releaseHealth.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">{releaseHealth.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adoption</p>
                <p className="font-medium">{releaseHealth.adoptionRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crash-Free</p>
                <p className="font-medium">{releaseHealth.crashFreeRate.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="font-medium">{releaseHealth.sessionCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Issues</p>
                <p className="font-medium">{releaseHealth.newIssues}</p>
              </div>
            </div>
            {releaseHealth.status !== 'healthy' && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Release health is {releaseHealth.status}. Consider rolling back if issues persist.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Issues List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Error Issues</CardTitle>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-1 border rounded-md text-sm"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="error">Errors Only</option>
                <option value="warning">Warnings</option>
                <option value="info">Info</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchErrorData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {errorIssues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No active error issues found!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your application is running smoothly
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {errorIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="flex items-start gap-4">
                    {getSeverityIcon(issue.level)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{issue.title}</span>
                        {issue.isRegression && (
                          <Badge variant="destructive" className="text-xs">
                            REGRESSION
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {issue.culprit}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {issue.userCount} users
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {issue.count} events
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: {formatTimeAgo(issue.lastSeen)}
                        </span>
                        {issue.platform && (
                          <span className="flex items-center gap-1">
                            {issue.platform}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(issue.level)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Issue Details */}
      {selectedIssue && (
        <Alert>
          <Bug className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-start">
              <div>
                <strong>Issue Details:</strong> {selectedIssue.title}
                <br />
                Location: {selectedIssue.culprit}
                <br />
                Impact: {selectedIssue.userCount} users, {selectedIssue.count} occurrences
                <br />
                First seen: {formatTimeAgo(selectedIssue.firstSeen)} | Last: {formatTimeAgo(selectedIssue.lastSeen)}
                {selectedIssue.assignedTo && (
                  <>
                    <br />
                    Assigned to: {selectedIssue.assignedTo}
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIssue(null)}
              >
                Close
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
'use client';

/**
 * CI/CD Pipeline Monitor Component
 * Real-time monitoring following CLAUDE.md rules
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Package,
  TestTube,
  Rocket,
  Shield,
  PlayCircle,
  StopCircle,
  Bug
} from 'lucide-react';
import { ErrorMonitor } from './ErrorMonitor';

interface PipelineRun {
  id: string;
  branch: string;
  commit: string;
  author: string;
  message: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stages: {
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    duration?: number;
  }[];
}

interface DeploymentInfo {
  environment: string;
  version: string;
  status: 'success' | 'failed' | 'in_progress';
  deployedAt: Date;
  deployedBy: string;
  url?: string;
  rollbackAvailable: boolean;
}

interface BuildMetrics {
  totalBuilds: number;
  successRate: number;
  averageDuration: number;
  queueTime: number;
  testsPassed: number;
  testsFailed: number;
  codeCoverage: number;
  vulnerabilities: number;
}

export function CICDMonitor() {
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [metrics, setMetrics] = useState<BuildMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineRun | null>(null);
  const [activeTab, setActiveTab] = useState<'pipelines' | 'errors'>('pipelines');

  useEffect(() => {
    fetchCICDData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchCICDData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchCICDData = async () => {
    try {
      // Fetch from GitHub Actions API or Vercel API
      const [pipelineRes, deploymentRes, metricsRes] = await Promise.all([
        fetch('/api/monitoring/pipelines'),
        fetch('/api/monitoring/deployments'),
        fetch('/api/monitoring/build-metrics')
      ]);

      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        setPipelineRuns(data.runs || []);
      }

      if (deploymentRes.ok) {
        const data = await deploymentRes.json();
        setDeployments(data.deployments || []);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics || null);
      }
    } catch (error) {
      console.error('Failed to fetch CI/CD data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'cancelled':
        return <StopCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      failed: "destructive",
      running: "secondary",
      in_progress: "secondary",
      pending: "outline",
      cancelled: "outline"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60)),
      'minute'
    );
  };

  if (isLoading) {
    return <div>Loading CI/CD data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Build Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
              <Progress value={metrics.successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Build Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(metrics.averageDuration)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Queue time: {formatDuration(metrics.queueTime)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Test Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.codeCoverage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.testsPassed} passed, {metrics.testsFailed} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.vulnerabilities}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Vulnerabilities found
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Button
            variant={activeTab === 'pipelines' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('pipelines')}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            CI/CD Pipelines
          </Button>
          <Button
            variant={activeTab === 'errors' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('errors')}
          >
            <Bug className="h-4 w-4 mr-2" />
            Error Monitoring
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Auto-refresh
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Auto-refresh
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCICDData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pipelines' ? (
        <>
          {/* Recent Pipeline Runs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Pipeline Runs</CardTitle>
            </CardHeader>
        <CardContent>
          {pipelineRuns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pipeline runs found. Push a commit to trigger a build.
            </p>
          ) : (
            <div className="space-y-4">
              {pipelineRuns.slice(0, 10).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedPipeline(run)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(run.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        <span className="font-medium">{run.branch}</span>
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {run.commit.substring(0, 7)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {run.message} • by {run.author}
                      </p>
                      <div className="flex gap-4 mt-2">
                        {run.stages.map((stage) => (
                          <div key={stage.name} className="flex items-center gap-1">
                            {getStatusIcon(stage.status)}
                            <span className="text-xs">{stage.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(run.status)}
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(run.startTime)}
                    </p>
                    {run.duration && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {formatDuration(run.duration)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Deployments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          {deployments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No deployments found.
            </p>
          ) : (
            <div className="space-y-4">
              {deployments.map((deployment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4" />
                        <span className="font-medium">{deployment.environment}</span>
                        <Badge variant="outline">{deployment.version}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Deployed by {deployment.deployedBy} • {formatDate(deployment.deployedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deployment.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(deployment.url, '_blank')}
                      >
                        View
                      </Button>
                    )}
                    {deployment.rollbackAvailable && (
                      <Button variant="outline" size="sm">
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

          {/* Selected Pipeline Details */}
          {selectedPipeline && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <strong>Pipeline Details:</strong> {selectedPipeline.id}
                    <br />
                    Branch: {selectedPipeline.branch} • Commit: {selectedPipeline.commit}
                    <br />
                    Status: {selectedPipeline.status} • Duration: {formatDuration(selectedPipeline.duration)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPipeline(null)}
                  >
                    Close
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        /* Error Monitoring Tab */
        <ErrorMonitor />
      )}
    </div>
  );
}
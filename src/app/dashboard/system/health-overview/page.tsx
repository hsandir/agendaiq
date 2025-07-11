"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  RefreshCw,
  FileText,
  ExternalLink,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

interface HealthCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  lastCheck: string;
}

interface HealthChecks {
  total: number;
  passing: number;
  warning: number;
  failed: number;
  checks: HealthCheck[];
}

interface SystemStatus {
  linting: {
    errors: number;
    warnings: number;
    files: string[];
  };
}

export default function HealthOverviewPage() {
  const [healthChecks, setHealthChecks] = useState<HealthChecks | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch real system status
      const statusResponse = await fetch('/api/system/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData);
      }

      // Fetch real health check data
      const healthResponse = await fetch('/api/system/health-check?action=quick');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthChecks({
          total: healthData.results?.length || 0,
          passing: healthData.results?.filter((r: any) => r.status === 'success').length || 0,
          warning: healthData.results?.filter((r: any) => r.status === 'warning').length || 0,
          failed: healthData.results?.filter((r: any) => r.status === 'error').length || 0,
          checks: healthData.results?.map((result: any) => ({
            name: result.name,
            status: result.status === 'success' ? 'pass' as const : 
                   result.status === 'warning' ? 'warning' as const : 'fail' as const,
            lastCheck: new Date(result.timestamp).toLocaleString()
          })) || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health Overview</h1>
          <p className="text-muted-foreground">
            Monitor real-time system health and code quality
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Check Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Status Card */}
        <Link href="/dashboard/system/health">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Quick Status
              </CardTitle>
              <CardDescription>Real-time health monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{healthChecks?.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Checks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{healthChecks?.passing || 0}</div>
                    <div className="text-sm text-muted-foreground">Passing</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{healthChecks?.warning || 0}</div>
                    <div className="text-sm text-muted-foreground">Warning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{healthChecks?.failed || 0}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Health Summary</div>
                  {healthChecks?.checks.slice(0, 6).map((check, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="text-xs">{check.name}</span>
                      <Badge 
                        variant={check.status === 'pass' ? 'outline' : check.status === 'warning' ? 'outline' : 'destructive'}
                        className={check.status === 'pass' ? 'text-green-600 border-green-600' : check.status === 'warning' ? 'text-yellow-600 border-yellow-600' : ''}
                      >
                        {check.status === 'pass' ? 'PASS' : check.status === 'warning' ? 'WARN' : 'FAIL'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center text-xs text-muted-foreground mt-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View detailed health check
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Lint Error Status Card */}
        <Link href="/dashboard/system/lint">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-600" />
                Lint Error Status
              </CardTitle>
              <CardDescription>Code quality and linting issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{status?.linting.errors || 0}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{status?.linting.warnings || 0}</div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">
                    {(status?.linting?.errors || 0) > 0 ? `${status?.linting?.files?.length || 0} files affected` : 'No errors found'}
                  </div>
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {status?.linting.files.slice(0, 4).map((file, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {file}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center text-xs text-muted-foreground">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Manage lint errors
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
            System Overview
          </CardTitle>
          <CardDescription>
            Overall system health and monitoring summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-700">System Uptime</div>
              <div className="text-2xl font-bold text-green-600">99.8%</div>
              <div className="text-sm text-green-600">Last 30 days</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-700">Response Time</div>
              <div className="text-2xl font-bold text-blue-600">145ms</div>
              <div className="text-sm text-blue-600">Average</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-lg font-semibold text-orange-700">Last Check</div>
              <div className="text-2xl font-bold text-orange-600">2 min</div>
              <div className="text-sm text-orange-600">ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
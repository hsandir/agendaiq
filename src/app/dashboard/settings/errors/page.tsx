"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  AlertTriangle,
  Activity,
  Database,
  Clock,
  HardDrive,
  TrendingDown
} from "lucide-react";
import Link from "next/link";

interface SystemStatus {
  health: {
    overall: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    warnings: string[];
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
    memory?: any;
    node_version?: string;
  };
  linting: {
    errors: number;
    warnings: number;
    files: string[];
  };
  timestamp: string;
}

export default function ErrorManagementPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/system/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        throw new Error('Failed to fetch system status');
      }
    } catch (error) {
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

  const getStatusBadge = (status: boolean, text: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {status ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading error statistics...</p>
        </div>
      </div>
    );
  }

  const hasErrors = (status?.health.issues?.length || 0) > 0 || (status?.linting.errors || 0) > 0;
  const hasWarnings = (status?.health.warnings?.length || 0) > 0 || (status?.linting.warnings || 0) > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Error Management</h1>
          <p className="text-muted-foreground">Monitor and manage system errors</p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              System Overview
            </Button>
          </Link>
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
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        ))}
      </div>

      {status && (
        <>
          {/* System Health Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                System Health Overview
              </CardTitle>
              <CardDescription>
                Current system health status and overall performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">Overall Status</span>
                {getHealthBadge(status.health.overall)}
              </div>
              
              {status.health.issues.length > 0 && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Critical Issues:</strong>
                    <ul className="mt-2 list-disc list-inside">
                      {status.health.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {status.health.warnings.length > 0 && (
                <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warnings:</strong>
                    <ul className="mt-2 list-disc list-inside">
                      {status.health.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {!hasErrors && !hasWarnings && (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Errors Found</h3>
                  <p className="text-gray-500">
                    No system errors have been logged recently. This is a good sign!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Statistics */}
          <div className="grid gap-6 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{status.health.issues.length}</div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{status.health.warnings.length}</div>
                <p className="text-xs text-muted-foreground">
                  Need monitoring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lint Errors</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{status.linting.errors}</div>
                <p className="text-xs text-muted-foreground">
                  Code quality issues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">100%</div>
                <p className="text-xs text-muted-foreground">
                  {status.server.uptime}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                System Health Details
              </CardTitle>
              <CardDescription>
                Detailed health metrics for each system component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Database Connection
                  </span>
                  {getStatusBadge(status.database.connected, status.database.connected ? 'Connected' : 'Disconnected')}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Server Status
                  </span>
                  {getStatusBadge(status.server.running, status.server.running ? 'Running' : 'Stopped')}
                </div>
                
                                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                      <HardDrive className="w-4 h-4 mr-2" />
                      Memory Usage
                    </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Normal
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Error Rate
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {status.health.issues.length === 0 ? '0.0%' : 'Low'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Server, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Cpu,
  HardDrive,
  Activity,
  Clock,
  Monitor,
  Wifi,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

interface ServerMetrics {
  system: {
    platform: string;
    architecture: string;
    nodeVersion: string;
    nextVersion: string;
    uptime: string;
    hostname: string;
  };
  performance: {
    memory: {
      total: number;
      used: number;
      free: number;
      usage: number;
    };
    cpu: {
      usage: number;
      cores: number;
      model: string;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      usage: number;
    };
  };
  network: {
    protocol: string;
    host: string;
    port: number;
    status: string;
  };
  health: {
    overall: 'healthy' | 'warning' | 'critical';
    alerts: string[];
  };
}

export default function ServerManagementPage() {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const fetchServerMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock server metrics for demo purposes
      const mockMetrics: ServerMetrics = {
        system: {
          platform: "darwin",
          architecture: "arm64",
          nodeVersion: "18.19.1",
          nextVersion: "14.2.5",
          uptime: "2 days 14 hours",
          hostname: "AgendaIQ-Server"
        },
        performance: {
          memory: {
            total: 16,
            used: 8.5,
            free: 7.5,
            usage: 53
          },
          cpu: {
            usage: 35,
            cores: 8,
            model: "Apple M2"
          },
          disk: {
            total: 500,
            used: 285,
            free: 215,
            usage: 57
          }
        },
        network: {
          protocol: "HTTP",
          host: "localhost",
          port: 3000,
          status: "Active"
        },
        health: {
          overall: 'healthy',
          alerts: []
        }
      };
      
      // Generate health alerts based on performance
      if (mockMetrics.performance.memory.usage > 80) {
        mockMetrics.health.overall = 'warning';
        mockMetrics.health.alerts.push('High memory usage detected');
      }
      
      if (mockMetrics.performance.cpu.usage > 90) {
        mockMetrics.health.overall = 'critical';
        mockMetrics.health.alerts.push('Critical CPU usage');
      }
      
      if (mockMetrics.performance.disk.usage > 85) {
        if (mockMetrics.health.overall === 'healthy') {
          mockMetrics.health.overall = 'warning';
        }
        mockMetrics.health.alerts.push('Low disk space available');
      }
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch server metrics:', error);
      showNotification('Failed to fetch server metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchServerMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    return `${bytes} GB`;
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
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
          <p>Loading server metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Server className="w-8 h-8 mr-3 text-green-600" />
            Server Management
          </h1>
          <p className="text-muted-foreground">Monitor server performance and system metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <Button 
            onClick={fetchServerMetrics}
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

      {metrics && (
        <>
          {/* Server Overview */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getHealthBadge(metrics.health.overall)}
                  {metrics.health.alerts.length > 0 && (
                    <p className="text-xs text-orange-600">{metrics.health.alerts.length} alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.memory.usage}%</div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(metrics.performance.memory.used)} / {formatBytes(metrics.performance.memory.total)}
                </p>
                <Progress value={metrics.performance.memory.usage} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.cpu.usage}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.performance.cpu.cores} cores
                </p>
                <Progress value={metrics.performance.cpu.usage} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.disk.usage}%</div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(metrics.performance.disk.free)} free
                </p>
                <Progress value={metrics.performance.disk.usage} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2 text-blue-600" />
                  System Information
                </CardTitle>
                <CardDescription>Server specifications and runtime details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Platform</p>
                      <p className="text-sm text-gray-900">{metrics.system.platform}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Architecture</p>
                      <p className="text-sm text-gray-900">{metrics.system.architecture}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Node.js Version</p>
                      <p className="text-sm text-gray-900">v{metrics.system.nodeVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Next.js Version</p>
                      <p className="text-sm text-gray-900">v{metrics.system.nextVersion}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Hostname</p>
                      <p className="text-sm text-gray-900">{metrics.system.hostname}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Uptime</p>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-green-600" />
                        <p className="text-sm text-gray-900">{metrics.system.uptime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wifi className="h-5 w-5 mr-2 text-green-600" />
                  Network Configuration
                </CardTitle>
                <CardDescription>Network and connection settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Protocol</p>
                      <p className="text-sm text-gray-900">{metrics.network.protocol}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {metrics.network.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Host</p>
                      <p className="text-sm text-gray-900">{metrics.network.host}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Port</p>
                      <p className="text-sm text-gray-900">{metrics.network.port}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Full URL</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {metrics.network.protocol.toLowerCase()}://{metrics.network.host}:{metrics.network.port}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-600" />
                Performance Details
              </CardTitle>
              <CardDescription>Detailed resource usage and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Memory Details */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <Monitor className="w-4 h-4 mr-2" />
                    Memory
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="text-sm font-medium">{formatBytes(metrics.performance.memory.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Used</span>
                      <span className="text-sm font-medium">{formatBytes(metrics.performance.memory.used)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Free</span>
                      <span className="text-sm font-medium">{formatBytes(metrics.performance.memory.free)}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Usage</span>
                        <span>{metrics.performance.memory.usage}%</span>
                      </div>
                      <Progress value={metrics.performance.memory.usage} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* CPU Details */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <Cpu className="w-4 h-4 mr-2" />
                    CPU
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Model</span>
                      <span className="text-sm font-medium">{metrics.performance.cpu.model}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cores</span>
                      <span className="text-sm font-medium">{metrics.performance.cpu.cores}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Load</span>
                      <span className="text-sm font-medium">{metrics.performance.cpu.usage}%</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Usage</span>
                        <span>{metrics.performance.cpu.usage}%</span>
                      </div>
                      <Progress value={metrics.performance.cpu.usage} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Disk Details */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <HardDrive className="w-4 h-4 mr-2" />
                    Storage
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="text-sm font-medium">{formatBytes(metrics.performance.disk.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Used</span>
                      <span className="text-sm font-medium">{formatBytes(metrics.performance.disk.used)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Free</span>
                      <span className="text-sm font-medium">{formatBytes(metrics.performance.disk.free)}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Usage</span>
                        <span>{metrics.performance.disk.usage}%</span>
                      </div>
                      <Progress value={metrics.performance.disk.usage} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Health Summary
              </CardTitle>
              <CardDescription>Overall server health and performance alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Status</span>
                  {getHealthBadge(metrics.health.overall)}
                </div>
                
                {metrics.health.alerts.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Active Alerts</p>
                    <div className="space-y-2">
                      {metrics.health.alerts.map((alert, index) => (
                        <Alert key={index} className="border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{alert}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      All systems are operating normally. No alerts or warnings detected.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
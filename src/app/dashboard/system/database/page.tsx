"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  ArrowLeft, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
  HardDrive,
  Users,
  Clock
} from "lucide-react";
import Link from "next/link";

interface DatabaseMetrics {
  connection: {
    url: string;
    host: string;
    port: string;
    database: string;
    username: string;
    connected: boolean;
    uptime: string;
  };
  statistics: {
    tables: number;
    totalRecords: number;
    totalSize: string;
    activeConnections: number;
    maxConnections: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    queriesPerSecond: number;
    cacheHitRatio: number;
  };
  tables: Array<{
    name: string;
    rows: number;
    size: string;
    lastAccess: string;
  }>;
}

export default function DatabaseManagementPage() {
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const fetchDatabaseMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from real database metrics API
      const response = await fetch('/api/system/database-metrics');
      if (response.ok) {
        const databaseMetrics: DatabaseMetrics = await response.json();
        setMetrics(databaseMetrics);
        showNotification('Real-time database metrics loaded successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch database metrics');
      }
    } catch (error) {
      console.error('Failed to fetch database metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch database metrics';
      setError(errorMessage);
      showNotification(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDatabaseMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Database className="w-8 h-8 mr-3 text-blue-600" />
              Database Management
            </h1>
            <p className="text-muted-foreground">Loading real-time database metrics...</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/dashboard/system">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to System
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading real-time database information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Database className="w-8 h-8 mr-3 text-blue-600" />
              Database Management
            </h1>
            <p className="text-muted-foreground">Real-time database monitoring and management</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/dashboard/system">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to System
              </Button>
            </Link>
            <Button 
              onClick={fetchDatabaseMetrics}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>

        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Failed to load database metrics:</strong> {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            Database Management
          </h1>
          <p className="text-muted-foreground">Real-time database monitoring with live Prisma data</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <Button 
            onClick={fetchDatabaseMetrics}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
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
          {/* Connection Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-blue-600" />
                Live Database Connection
              </CardTitle>
              <CardDescription>Real-time database connection and configuration details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><strong>Host:</strong> {metrics.connection.host}</div>
                    <div><strong>Port:</strong> {metrics.connection.port}</div>
                    <div><strong>Database:</strong> {metrics.connection.database}</div>
                    <div><strong>Username:</strong> {metrics.connection.username}</div>
                  </div>
                </div>
                <div>
                  <div className="space-y-2 text-sm">
                    <div><strong>Process Uptime:</strong> {metrics.connection.uptime}</div>
                    <div><strong>Active Connections:</strong> {metrics.statistics.activeConnections}/{metrics.statistics.maxConnections}</div>
                    <div><strong>Connection String:</strong> {metrics.connection.url}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Tables</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.statistics.tables}</div>
                <p className="text-xs text-muted-foreground">
                  Active Prisma tables
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.statistics.totalRecords.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Live record count
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Size</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.statistics.totalSize}</div>
                <p className="text-xs text-muted-foreground">
                  Calculated storage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Query Performance</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.avgQueryTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Real-time Performance Metrics
              </CardTitle>
              <CardDescription>Live database performance indicators based on actual usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.performance.queriesPerSecond}</div>
                  <div className="text-sm text-muted-foreground">Queries/Second</div>
                  <div className="text-xs text-gray-500 mt-1">Estimated throughput</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.performance.cacheHitRatio}%</div>
                  <div className="text-sm text-muted-foreground">Cache Hit Ratio</div>
                  <div className="text-xs text-gray-500 mt-1">Query efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{metrics.performance.slowQueries}</div>
                  <div className="text-sm text-muted-foreground">Slow Queries</div>
                  <div className="text-xs text-gray-500 mt-1">Performance alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Table Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-600" />
                Live Table Statistics
              </CardTitle>
              <CardDescription>Real-time table data from active Prisma queries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.tables.map((table, index) => (
                  <div key={table.name} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Database className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{table.name}</h4>
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              Live Data
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span><strong>Records:</strong> {table.rows.toLocaleString()}</span>
                            <span><strong>Size:</strong> {table.size}</span>
                            <span><strong>Last Access:</strong> {new Date(table.lastAccess).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(table.lastAccess).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Real-time Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Data Source:</span>
                  <span className="ml-2">Live Prisma queries</span>
                </div>
                <div>
                  <span className="font-medium">Update Frequency:</span>
                  <span className="ml-2">Every 30 seconds</span>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <span className="ml-2">{new Date().toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="font-medium">Connection Type:</span>
                  <span className="ml-2">PostgreSQL (Prisma ORM)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
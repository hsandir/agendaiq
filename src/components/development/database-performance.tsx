'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface DatabaseMetrics {
  timestamp: string;
  tests: Array<{
    name: string;
    query: string;
    time: string;
    result?: string;
  }>;
  summary: {
    totalTests: number;
    totalTime: string;
    averageTime: string;
    minTime: string;
    maxTime: string;
    connectionPoolStatus: Record<string, unknown>;
  };
}

export function DatabasePerformance() {
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/db-performance');
      if (!response.ok) {
        throw new Error('Failed to fetch database metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getTimeColor = (timeStr: string) => {
    const time = parseFloat(timeStr);
    if (time < 10) return 'text-green-600';
    if (time < 50) return 'text-yellow-600';
    if (time < 100) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTimeStatus = (timeStr: string) => {
    const time = parseFloat(timeStr);
    if (time < 10) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (time < 50) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (time < 100) return { label: 'Slow', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Critical', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>Real-time database connection and query metrics</CardDescription>
            </div>
            <Button
              onClick={fetchMetrics}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Testing...' : 'Run Tests'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {metrics && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Time</p>
                  <p className={`text-2xl font-bold ${getTimeColor(metrics.summary.totalTime)}`}>
                    {metrics.summary.totalTime}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className={`text-2xl font-bold ${getTimeColor(metrics.summary.averageTime)}`}>
                    {metrics.summary.averageTime}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Min Time</p>
                  <p className={`text-2xl font-bold ${getTimeColor(metrics.summary.minTime)}`}>
                    {metrics.summary.minTime}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Max Time</p>
                  <p className={`text-2xl font-bold ${getTimeColor(metrics.summary.maxTime)}`}>
                    {metrics.summary.maxTime}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tests Run</p>
                  <p className="text-2xl font-bold">{metrics.summary.totalTests}</p>
                </div>
              </div>

              {/* Individual Test Results */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Test Results</h3>
                <div className="grid gap-3">
                  {metrics.tests.map((test, index) => {
                    const status = getTimeStatus(test.time);
                    const time = parseFloat(test.time);
                    const maxTime = (Math.max(...metrics.tests.map(t => parseFloat(t.time))));
                    const percentage = (time / maxTime) * 100;

                    return (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{test.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={status.color} variant="secondary">
                              {status.label}
                            </Badge>
                            <span className={`font-mono text-sm ${getTimeColor(test.time)}`}>
                              {test.time}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="font-mono">{test.query}</span>
                            {test.result && <span>{test.result}</span>}
                          </div>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connection Pool Status */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium text-sm mb-2">Connection Pool Status</h3>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    {metrics.summary.connectionPoolStatus.status === 'active' 
                      ? 'Database connection pool is active'
                      : 'Connection pool status unknown'}
                  </span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-4 space-y-2">
                <h3 className="font-medium text-sm">Performance Analysis</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {parseFloat(metrics.summary.averageTime) > 50 && (
                    <p className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                      Average query time is high. Consider optimizing queries or adding indexes.
                    </p>
                  )}
                  {parseFloat(metrics.summary.maxTime) > 100 && (
                    <p className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                      Some queries are taking over 100ms. Review complex queries for optimization.
                    </p>
                  )}
                  {parseFloat(metrics.summary.minTime) < 5 && (
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Connection latency is excellent ({metrics.summary.minTime}).
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {!metrics && !loading && !error && (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Click "Run Tests" to measure database performance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
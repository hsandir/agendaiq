'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Ban,
  Check
} from 'lucide-react';

interface RateLimitMetrics {
  summary: {
    totalClients: number;
    totalRequests: number;
    totalBlocked: number;
    totalAllowed: number;
    averageBlockRate: number;
    topOffenders: Array<{
      identifier: string;
      blockedRequests: number;
      totalRequests: number;
    }>;
  };
  details: Record<string, {
    totalRequests: number;
    blockedRequests: number;
    allowedRequests: number;
    uniqueClients: number;
    averageResponseTime: number;
    peakRequestsPerMinute: number;
  }>;
}

export default function RateLimitMonitor() {
  const [metrics, setMetrics] = useState<RateLimitMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ipInput, setIpInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/rate-limits');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err: unknown) {
      setError('Failed to load rate limit metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleAction = async (action: string) => {
    if ((action === 'blacklist' || action === 'whitelist' || 
         action === 'unblacklist' || action === 'unwhitelist') && !ipInput) {
      setError('Please enter an IP address');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ip: ipInput ?? undefined }),
      });

      if (!response.ok) throw new Error('Action failed');
      
      const result = await response.json();
      alert(result.message);
      setIpInput('');
      await fetchMetrics();
    } catch (err: unknown) {
      setError('Failed to perform action');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const clearMetrics = async () => {
    if (!confirm('Are you sure you want to clear all metrics?')) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/rate-limits', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to clear metrics');
      
      await fetchMetrics();
    } catch (err: unknown) {
      setError('Failed to clear metrics');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
          <span className="text-destructive">{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const blockRate = metrics.summary.averageBlockRate * 100;
  const isHealthy = blockRate < 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rate Limit Monitor</h2>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{metrics.summary.totalClients}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{metrics.summary.totalRequests.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Blocked Requests</p>
              <p className="text-2xl font-bold">{metrics.summary.totalBlocked.toLocaleString()}</p>
            </div>
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Block Rate</p>
              <p className="text-2xl font-bold">{blockRate.toFixed(1)}%</p>
            </div>
            {isHealthy ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            )}
          </div>
        </Card>
      </div>

      {/* Status Indicator */}
      <Card className={`p-4 ${isHealthy ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center">
          <Shield className={`h-5 w-5 mr-2 ${isHealthy ? 'text-green-600' : 'text-yellow-600'}`} />
          <span className={`font-medium ${isHealthy ? 'text-green-800' : 'text-yellow-800'}`}>
            Rate Limiting Status: {isHealthy ? 'Healthy' : 'Elevated Activity'}
          </span>
        </div>
      </Card>

      {/* Top Offenders */}
      {metrics.summary.topOffenders.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Blocked Clients</h3>
          <div className="space-y-2">
            {metrics.summary.topOffenders.map((offender, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <p className="font-mono text-sm">{offender.identifier}</p>
                  <p className="text-xs text-muted-foreground">
                    {offender.blockedRequests} blocked / {offender.totalRequests} total
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-destructive">
                    {((offender.blockedRequests / offender.totalRequests) * 100).toFixed(1)}% blocked
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Management Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Management Actions</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="destructive"
              onClick={() => handleAction('blacklist')}
              disabled={actionLoading || !ipInput}
            >
              <Ban className="h-4 w-4 mr-2" />
              Blacklist
            </Button>
            <Button
              variant="default"
              onClick={() => handleAction('whitelist')}
              disabled={actionLoading || !ipInput}
            >
              <Check className="h-4 w-4 mr-2" />
              Whitelist
            </Button>
          </div>

          {ipInput && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('unblacklist')}
                disabled={actionLoading}
              >
                Remove from Blacklist
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('unwhitelist')}
                disabled={actionLoading}
              >
                Remove from Whitelist
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={clearMetrics}
              disabled={actionLoading}
            >
              Clear All Metrics
            </Button>
          </div>
        </div>
      </Card>

      {/* Detailed Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Client Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Client</th>
                <th className="text-right py-2">Total</th>
                <th className="text-right py-2">Allowed</th>
                <th className="text-right py-2">Blocked</th>
                <th className="text-right py-2">Peak/min</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.details).slice(0, 20).map(([key, value]) => (
                <tr key={key} className="border-b">
                  <td className="py-2 font-mono text-xs">{key}</td>
                  <td className="text-right py-2">{value.totalRequests}</td>
                  <td className="text-right py-2 text-green-600">{value.allowedRequests}</td>
                  <td className="text-right py-2 text-destructive">{value.blockedRequests}</td>
                  <td className="text-right py-2">{value.peakRequestsPerMinute.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
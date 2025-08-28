'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Bug,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Download,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Activity,
  Globe,
  Terminal,
  Clock,
  TrendingUp,
  Filter,
  Search,
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import ErrorTrackerInstance, { ErrorDetail } from '@/lib/debug/error-tracker';

export default function DebugDashboard() {
  const [errors, setErrors] = useState<ErrorDetail[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorDetail | null>(null);

  useEffect(() => {
    // Load initial errors
    const loadErrors = () => {
      const allErrors = ErrorTrackerInstance.getErrors();
      setErrors(allErrors);
      setStatistics(ErrorTrackerInstance.getStatistics());
    };

    loadErrors();

    // Subscribe to new errors
    const unsubscribe = ErrorTrackerInstance.subscribe((newError) => {
      loadErrors();
    });

    // Auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadErrors, 2000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const toggleErrorExpansion = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const clearAllErrors = () => {
    ErrorTrackerInstance.clearErrors();
    setErrors([]);
    setStatistics(ErrorTrackerInstance.getStatistics());
  };

  const exportErrors = () => {
    const json = ErrorTrackerInstance.exportErrors();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyErrorDetails = (error: ErrorDetail) => {
    const details = JSON.stringify(error, null, 2);
    navigator.clipboard.writeText(details);
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'network':
        return <Globe className="h-5 w-5 text-blue-500" />;
      case 'console':
        return <Terminal className="h-5 w-5 text-purple-500" />;
      case 'unhandledRejection':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  };

  const getErrorBadgeVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'network':
        return 'outline';
      default:
        return 'default'
    }
  };

  // Filter errors
  const filteredErrors = errors.filter(error => {
    if (filterType !== 'all' && error.type !== filterType) return false;
    if (searchTerm && !error.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Generate test errors for debugging
  const generateTestError = (type: string) => {
    switch (type) {
      case 'error':
        throw new Error('Test error generated from debug dashboard');
      case 'warning':
        console.warn('Test warning from debug dashboard');
        break;
      case 'network':
        fetch('/api/non-existent-endpoint');
        break;
      case 'console':
        console.error('Test console error', { data: 'test' });
        break;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time error tracking and system debugging tools
          </p>
        </div>
        <div className="flex gap-2">
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
            onClick={exportErrors}
            disabled={errors.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllErrors}
            disabled={errors.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All captured errors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last 5 Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.last5Minutes}</div>
              <p className="text-xs text-muted-foreground mt-1">Recent activity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.lastHour}</div>
              <p className="text-xs text-muted-foreground mt-1">Hourly trend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.last24Hours}</div>
              <p className="text-xs text-muted-foreground mt-1">Daily total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Error Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(statistics.byType).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{type}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Error Generators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Generate Test Errors</CardTitle>
          <CardDescription>Create test errors for debugging purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateTestError('error')}
            >
              <Bug className="h-4 w-4 mr-2" />
              Throw Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateTestError('warning')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Console Warning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateTestError('network')}
            >
              <WifiOff className="h-4 w-4 mr-2" />
              Network Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateTestError('console')}
            >
              <Terminal className="h-4 w-4 mr-2" />
              Console Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Error List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Captured Errors</CardTitle>
              <CardDescription>All errors, warnings, and network failures</CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-1 border rounded-md text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="error">Errors</option>
                <option value="warning">Warnings</option>
                <option value="network">Network</option>
                <option value="console">Console</option>
                <option value="unhandledRejection">Unhandled</option>
              </select>
              <input
                type="text"
                placeholder="Search errors..."
                className="px-3 py-1 border rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredErrors.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No errors captured</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate test errors above to see how they appear
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredErrors.map((error) => (
                  <div
                    key={error.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getErrorIcon(error.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getErrorBadgeVariant(error.type) as any}>
                              {error.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {(() => {
                                try {
                                  return new Date(error.timestamp).toLocaleTimeString();
                                } catch (e) {
                                  return error.timestamp;
                                }
                              })()}
                            </span>
                            {error.url && (
                              <span className="text-xs text-muted-foreground">
                                {error.url}
                              </span>
                            )}
                          </div>
                          
                          <p className="font-medium text-sm mb-2">{error.message}</p>
                          
                          {error.source && (
                            <p className="text-xs text-muted-foreground mb-1">
                              Source: {error.source}
                              {error.lineno && `:${error.lineno}`}
                              {error.colno && `:${error.colno}`}
                            </p>
                          )}
                          
                          {error.method && error.status && (
                            <div className="flex items-center gap-2 text-xs mb-2">
                              <Badge variant="outline">{error.method}</Badge>
                              <Badge variant={error.status >= 400 ? 'destructive' : 'secondary'}>
                                {error.status} {error.statusText}
                              </Badge>
                            </div>
                          )}
                          
                          {expandedErrors.has(error.id) && error.stack && (
                            <div className="mt-3">
                              <p className="text-xs font-medium mb-1">Stack Trace:</p>
                              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                {error.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyErrorDetails(error)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {error.stack && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleErrorExpansion(error.id)}
                          >
                            {expandedErrors.has(error.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>
              This debug dashboard captures all JavaScript errors, console warnings, network failures, and unhandled promise rejections.
              Errors are stored in localStorage and persist across page refreshes. Maximum of 100 errors are kept at any time.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                Runtime Errors
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Warnings
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-blue-500" />
                Network Failures
              </span>
              <span className="flex items-center gap-1">
                <Terminal className="h-3 w-3 text-purple-500" />
                Console Logs
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                Promise Rejections
              </span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
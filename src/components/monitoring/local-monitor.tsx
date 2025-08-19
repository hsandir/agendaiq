'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ErrorAnalyzer, ErrorAnalysis } from '@/lib/monitoring/error-analyzer';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Monitor,
  Clock,
  Terminal,
  Bug,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Activity
} from 'lucide-react';

interface LocalError {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  analysis: ErrorAnalysis;
  resolved?: boolean;
}

interface RawError {
  id?: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
}

export default function LocalMonitor() {
  const [errors, setErrors] = useState<LocalError[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const intervalRef = useRef<NodeJS.Timeout>();

  // Error processing with analysis
  const processError = (rawError: RawError): LocalError => {
    const analysis = ErrorAnalyzer.analyzeError(rawError.message, rawError.url, rawError.stack);
    
    return {
      id: rawError.id || Date.now().toString(),
      timestamp: rawError.timestamp,
      message: rawError.message,
      stack: rawError.stack,
      url: rawError.url,
      userAgent: rawError.userAgent,
      analysis,
      resolved: false
    };
  };

  // Local error monitoring only
  const setupLocalErrorMonitoring = () => {
    const originalError = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    window.onerror = (message, source, lineno, colno, error) => {
      const rawError = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: typeof message === 'string' ? message : 'Unknown error',
        stack: error?.stack,
        url: source || window.location.href,
        userAgent: navigator.userAgent
      };

      const enhancedError = processError(rawError);
      setErrors(prev => [enhancedError, ...prev.slice(0, 49)]); // Keep 50 max
      originalError?.(message, source, lineno, colno, error);
      return false;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const rawError = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      const enhancedError = processError(rawError);
      setErrors(prev => [enhancedError, ...prev.slice(0, 49)]);
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event);
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    console.error = (...args) => {
      const message = (args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));

      // Only capture actual errors, not regular console.error usage
      if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
        const rawError = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          message: `Console Error: ${message}`,
          url: window.location.href,
          userAgent: navigator.userAgent
        };

        const enhancedError = processError(rawError);
        setErrors(prev => [enhancedError, ...prev.slice(0, 49)]);
      }
      
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      const message = (args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));

      // Only capture warnings that seem important
      if (message.toLowerCase().includes('deprecated') || message.toLowerCase().includes('warning')) {
        const rawError = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          message: `Console Warning: ${message}`,
          url: window.location.href,
          userAgent: navigator.userAgent
        };

        const enhancedError = processError(rawError);
        setErrors(prev => [enhancedError, ...prev.slice(0, 49)]);
      }

      originalConsoleWarn(...args);
    };

    return () => {
      window.onerror = originalError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  };

  // Start local monitoring
  const startLocalMonitoring = () => {
    setIsMonitoring(true);
    setConnectionStatus('connecting');

    const cleanup = setupLocalErrorMonitoring();

    // Check local system health periodically
    intervalRef.current = setInterval(async () => {
      // Local health checks (memory, performance, etc.)
      if (performance && 'memory' in performance) {
        const memoryInfo = (performance as { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number } }).memory;
        const memoryUsed = memoryInfo?.usedJSHeapSize ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
        if (memoryUsed > 100) { // If using more than 100MB
          const rawError = {
            id: `memory-warning-${Date.now()}`,
            timestamp: new Date().toISOString(),
            message: `High memory usage detected: ${memoryUsed.toFixed(1)}MB`,
            url: window.location.href,
            userAgent: navigator.userAgent
          };
          const enhancedError = processError(rawError);
          setErrors(prev => {
            const exists = prev.find(e => (e instanceof Error ? e.message : String(e)).includes('High memory usage'));
            if (!exists) {
              return [enhancedError, ...prev.slice(0, 49)];
            }
            return prev;
          });
        }
      }
    }, 30000); // Check every 30 seconds

    setTimeout(() => setConnectionStatus('connected'), 1000);
    return cleanup;
  };

  // Stop monitoring
  const stopLocalMonitoring = () => {
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Filter errors
  const filteredErrors = errors.filter(error => {
    if (filterSeverity !== 'all' && error.analysis.severity !== filterSeverity) return false;
    if (filterCategory !== 'all' && error.analysis.category !== filterCategory) return false;
    if (searchTerm && !error.message.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !error.analysis.pageContext.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Generate report
  const errorReport = ErrorAnalyzer.generateErrorReport(errors);

  // Toggle error expansion
  const toggleErrorExpansion = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  // Mark error as resolved
  const markAsResolved = (errorId: string) => {
    setErrors(prev => prev.map(err => 
      err.id === errorId ? { ...err, resolved: true } : err
    ));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Local Error Monitoring</h2>
          <Badge className={`${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
                          connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
            {connectionStatus === 'connected' && <Activity className="h-3 w-3 mr-1" />}
            {connectionStatus === 'disconnected' && <XCircle className="h-3 w-3 mr-1" />}
            {connectionStatus === 'connecting' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
            {connectionStatus === 'connected' ? 'Active' : 
             connectionStatus === 'connecting' ? 'Connecting' : 'Stopped'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? stopLocalMonitoring : startLocalMonitoring}
          >
            {isMonitoring ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Report Summary */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Local System Status</h3>
            <p className="text-muted-foreground">{errorReport.summary}</p>
          </div>
          <Monitor className="h-8 w-8 text-primary" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{errorReport.totalErrors}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorReport.criticalCount}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{errorReport.highCount}</div>
            <div className="text-sm text-muted-foreground">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{errorReport.mediumCount}</div>
            <div className="text-sm text-muted-foreground">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{errorReport.lowCount}</div>
            <div className="text-sm text-muted-foreground">Low</div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <select 
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="all">All Severity Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="all">All Categories</option>
          <option value="authentication">Authentication</option>
          <option value="database">Database</option>
          <option value="api">API</option>
          <option value="frontend">Frontend</option>
          <option value="security">Security</option>
          <option value="performance">Performance</option>
        </select>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Search errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm w-48"
          />
        </div>

        <Badge variant="outline">{filteredErrors.length} results</Badge>
      </div>

      {/* Error List */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No local errors found</p>
              <p className="text-sm">Local system appears healthy 🎉</p>
            </div>
          ) : (
            filteredErrors.map((error) => (
              <Card 
                key={error.id} 
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  error.resolved ? 'opacity-60 bg-green-50' : ''
                }`}
                onClick={() => toggleErrorExpansion(error.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleErrorExpansion(error.id);
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {expandedErrors.has(error.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </button>
                      
                      {getSeverityIcon(error.analysis.severity)}
                      
                      <Badge variant="secondary">Local</Badge>
                      
                      <Badge variant="outline" className={`
                        ${error.analysis.severity === 'critical' ? 'border-red-500 text-red-700' : ''}
                        ${error.analysis.severity === 'high' ? 'border-orange-500 text-orange-700' : ''}
                        ${error.analysis.severity === 'medium' ? 'border-yellow-500 text-yellow-700' : ''}
                        ${error.analysis.severity === 'low' ? 'border-blue-500 text-blue-700' : ''}
                      `}>
                        {error.analysis.severity.toUpperCase()}
                      </Badge>

                      <Badge variant="outline" className="text-xs">
                        {error.analysis.pageContext}
                      </Badge>
                      
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>

                      {error.resolved && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          ✅ Resolved
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1 break-words">
                      {error.message}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      📍 {error.analysis.pageContext} | ⏱️ {error.analysis.estimatedFixTime}
                    </p>
                    
                    <p className="text-xs text-blue-600 mb-2">
                      💡 {error.analysis.description}
                    </p>

                    {/* Expanded Content */}
                    {expandedErrors.has(error.id) && (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        {/* Impact */}
                        <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                          <h5 className="font-semibold text-red-800 text-sm mb-1">⚠️ Impact</h5>
                          <p className="text-red-700 text-xs">{error.analysis.impact}</p>
                        </div>

                        {/* Solutions */}
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                          <h5 className="font-semibold text-green-800 text-sm mb-2">🔧 Solution Recommendations</h5>
                          <ul className="space-y-1">
                            {error.analysis.solutions.map((solution, idx) => (
                              <li key={idx} className="text-green-700 text-xs flex items-start gap-1">
                                <span className="text-green-500 mt-0.5">•</span>
                                {solution}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Stack Trace */}
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              Show Stack Trace
                            </summary>
                            <pre className="text-xs mt-2 p-3 bg-muted rounded overflow-x-auto max-h-40">
                              {error.stack}
                            </pre>
                          </details>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          {!error.resolved && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsResolved(error.id);
                              }}
                            >
                              ✅ Mark as Resolved
                            </Button>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Priority: {error.analysis.priorityScore}/100
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
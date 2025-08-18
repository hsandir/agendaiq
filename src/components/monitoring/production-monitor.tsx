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
  Globe,
  Clock,
  Shield,
  Bug,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Activity,
  Lock
} from 'lucide-react';

interface ProductionError {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  analysis: ErrorAnalysis;
  resolved?: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RawProductionError {
  id?: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  severity?: string;
}

export default function ProductionMonitor() {
  const [errors, setErrors] = useState<ProductionError[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const intervalRef = useRef<NodeJS.Timeout>();

  // Process production error with analysis
  const processProductionError = (rawError: RawProductionError): ProductionError => {
    const analysis = ErrorAnalyzer.analyzeError(rawError.message, rawError.url, rawError.stack);
    
    return {
      id: rawError.id || Date.now().toString(),
      timestamp: rawError.timestamp,
      message: rawError.message,
      stack: rawError.stack,
      url: rawError.url,
      userAgent: rawError.userAgent,
      severity: (rawError.severity as "low" | "medium" | "high" | "critical") || 'medium',
      analysis,
      resolved: false
    };
  };

  // Fetch production errors with admin authentication
  const fetchProductionErrors = async () => {
    try {
      // Try admin-authenticated endpoint
      const adminResponse = await fetch('/api/monitoring/production-errors-admin');
      if (adminResponse.ok) {
        const data = await adminResponse.json();
        setIsAdmin(true);
        return data.errors || [];
      } else if (adminResponse.status === 401 || adminResponse.status === 403) {
        // User is not admin
        setIsAdmin(false);
        return [{
          id: `auth-warning-${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: 'Admin access required for production error monitoring',
          url: '/dashboard/monitoring',
          userAgent: 'Monitoring System',
          severity: 'medium' as const,
          analysis: {
            category: 'authentication' as const,
            severity: 'medium' as const,
            pageContext: 'Production Monitoring',
            description: 'Full production monitoring requires administrator privileges',
            impact: 'Limited monitoring capabilities for non-admin users',
            solutions: [
              'Request administrator access from system admin',
              'Contact IT support for monitoring permissions',
              'Use local error monitoring features'
            ],
            preventiveMeasures: [
              'Ensure proper role-based access control',
              'Regular admin access reviews'
            ],
            affectedComponents: ['Production Monitoring'],
            estimatedFixTime: '5-10 minutes',
            priorityScore: 60,
            relatedErrors: []
          }
        }];
      }
    } catch (error: unknown) {
      console.error('Failed to fetch production errors:', error);
      return [{
        id: `fetch-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: `Failed to fetch production errors: ${error}`,
        url: '/api/monitoring/production-errors-admin',
        userAgent: 'Monitoring System',
        severity: 'high' as const,
        analysis: {
          category: 'api' as const,
          severity: 'high' as const,
          pageContext: 'Production Monitoring',
          description: 'Unable to connect to production monitoring endpoint',
          impact: 'Production error monitoring is unavailable',
          solutions: [
            'Check network connectivity',
            'Verify monitoring service is running',
            'Check authentication credentials'
          ],
          preventiveMeasures: [
            'Monitor service health',
            'Set up service redundancy'
          ],
          affectedComponents: ['Production Monitoring API'],
          estimatedFixTime: '10-15 minutes',
          priorityScore: 70,
          relatedErrors: []
        }
      }];
    }
    return [];
  };

  // Start production monitoring
  const startProductionMonitoring = () => {
    setIsMonitoring(true);
    setConnectionStatus('connecting');

    intervalRef.current = setInterval(async () => {
      const prodErrors = await fetchProductionErrors();
      
      prodErrors.forEach((error: RawProductionError) => {
        setErrors(prev => {
          const exists = prev.find(e => e.id === error.id);
          if (!exists) {
            const enhancedError = processProductionError(error);
            return [enhancedError, ...prev.slice(0, 49)]; // Keep 50 max
          }
          return prev;
        });
      });
    }, 10000); // Check every 10 seconds for production

    setTimeout(() => setConnectionStatus('connected'), 1000);
  };

  // Stop monitoring
  const stopProductionMonitoring = () => {
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
    )));
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
          <Globe className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Production Error Monitoring</h2>
          {!isAdmin && <Lock className="h-5 w-5 text-yellow-500" />}
          <Badge className={`${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
                          connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
            {connectionStatus === 'connected' && <Activity className="h-3 w-3 mr-1" />}
            {connectionStatus === 'disconnected' && <XCircle className="h-3 w-3 mr-1" />}
            {connectionStatus === 'connecting' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
            {connectionStatus === 'connected' ? 'Active' : 
             connectionStatus === 'connecting' ? 'Connecting' : 'Stopped'}
          </Badge>
          {isAdmin && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              <Shield className="h-3 w-3 mr-1" />
              Admin Access
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? stopProductionMonitoring : startProductionMonitoring}
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

      {!isAdmin && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Administrator Access Required</h3>
              <p className="text-sm text-yellow-700 mb-3">
                Full production error monitoring requires administrator privileges. Contact your system administrator for access.
              </p>
              <div className="text-xs text-yellow-600">
                <strong>Available for admins:</strong> Production deployment status, real-time error tracking, 
                advanced debugging capabilities, detailed error analysis
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error Report Summary */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Production System Status</h3>
            <p className="text-muted-foreground">{errorReport.summary}</p>
          </div>
          <Globe className="h-8 w-8 text-primary" />
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

        {isAdmin && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm text-blue-700">
              🔍 <strong>Production Site:</strong> agendaiq.vercel.app | 
              📊 <strong>Monitoring Level:</strong> Administrator | 
              ⚡ <strong>Update Frequency:</strong> 10 seconds
            </p>
          </div>
        )}
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
            placeholder="Search production errors..."
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
              <p>No production errors found</p>
              <p className="text-sm">Production system appears healthy 🌟</p>
            </div>
          ) : (
            filteredErrors.map((error) => (
              <Card 
                key={error.id} 
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  error.resolved ? 'opacity-60 bg-green-50' : ''
                } ${error.analysis.severity === 'critical' ? 'border-l-4 border-red-500' : ''}`}
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
                      
                      <Badge variant="destructive">Production</Badge>
                      
                      <Badge variant="outline" className={`
                        ${error.analysis.severity === 'critical' ? 'border-red-500 text-red-700 bg-red-50' : ''}
                        ${error.analysis.severity === 'high' ? 'border-orange-500 text-orange-700 bg-orange-50' : ''}
                        ${error.analysis.severity === 'medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
                        ${error.analysis.severity === 'low' ? 'border-blue-500 text-blue-700 bg-blue-50' : ''}
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
                      🌐 {error.analysis.pageContext} | ⏱️ {error.analysis.estimatedFixTime} | 
                      🔗 {error.url}
                    </p>
                    
                    <p className="text-xs text-blue-600 mb-2">
                      💡 {error.analysis.description}
                    </p>

                    {/* Expanded Content */}
                    {expandedErrors.has(error.id) && (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        {/* Impact */}
                        <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                          <h5 className="font-semibold text-red-800 text-sm mb-1">⚠️ Production Impact</h5>
                          <p className="text-red-700 text-xs">{error.analysis.impact}</p>
                        </div>

                        {/* Solutions */}
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                          <h5 className="font-semibold text-green-800 text-sm mb-2">🔧 Production Fix Recommendations</h5>
                          <ul className="space-y-1">
                            {error.analysis.solutions.map((solution, idx) => (
                              <li key={idx} className="text-green-700 text-xs flex items-start gap-1">
                                <span className="text-green-500 mt-0.5">•</span>
                                {solution}
                              </li>
                            ))}
                          </ul>
                        </div>

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
                          {isAdmin && (
                            <Badge variant="outline" className="text-xs bg-blue-50">
                              Admin View
                            </Badge>
                          )}
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
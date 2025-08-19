'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LiveLogEvent } from '@/lib/logging/types';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Terminal,
  Shield,
  Database,
  Globe,
  Zap,
  Clock,
  Filter,
  Search,
  TrendingUp,
  Users,
  Server,
  Bug,
  Play,
  Square,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface EnhancedLiveMonitorProps {
  realtimeEndpoint?: string;
  showDevLogs?: boolean;
  showAuditLogs?: boolean;
}

export default function EnhancedLiveMonitor({ 
  realtimeEndpoint = '/api/monitoring/live-logs',
  showDevLogs = true,
  showAuditLogs = true 
}: EnhancedLiveMonitorProps) {
  const [logs, setLogs] = useState<LiveLogEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    bySeverity: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    byCategory: {} as Record<string, number>
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const wsRef = useRef<WebSocket>();

  // Connect to live monitoring feed
  const connectToLiveFeed = () => {
    setIsMonitoring(true);
    setConnectionStatus('connecting');

    // Setup polling fallback
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(realtimeEndpoint);
        if (response.ok) {
          const data = await response.json();
          if (data.logs) {
            setLogs(prev => {
              const newLogs = [...data.logs, ...prev];
              return newLogs.slice(0, 1000); // Keep last 1000 logs
            });
            setStats(data.stats ?? stats);
          }
        }
      } catch (error: unknown) {
        console.error('Failed to fetch live logs:', error);
      }
    }, 2000);

    // Try WebSocket connection
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/monitoring/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        console.log('WebSocket connection established');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const logEvent: LiveLogEvent = JSON.parse(event.data);
          setLogs(prev => [logEvent, ...prev.slice(0, 999)]);
        } catch (error: unknown) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onerror = () => {
        console.warn('WebSocket error, falling back to polling');
        setConnectionStatus('connected'); // Still connected via polling
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
    } catch (error: unknown) {
      console.warn('WebSocket not available, using polling');
    }

    setTimeout(() => setConnectionStatus('connected'), 1000);
  };

  // Disconnect from live monitoring
  const disconnectFromLiveFeed = () => {
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
    if (filterSource !== 'all' && log.source !== filterSource) return false;
    if (filterCategory !== 'all' && log.category !== filterCategory) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Show/hide based on log type
    if (log.source === 'dev' && !showDevLogs) return false;
    if (log.source === 'audit' && !showAuditLogs) return false;
    
    return true;
  });

  // Toggle log expansion
  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  // Get icon for log source
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'dev': return <Terminal className="h-4 w-4" />;
      case 'audit': return <Shield className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Get icon for severity
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'api': <Globe className="h-3 w-3" />,
      'database': <Database className="h-3 w-3" />,
      'auth': <Shield className="h-3 w-3" />,
      'system': <Server className="h-3 w-3" />,
      'performance': <TrendingUp className="h-3 w-3" />,
      'error': <Bug className="h-3 w-3" />,
      'user_action': <Users className="h-3 w-3" />,
      'login_attempt': <Shield className="h-3 w-3" />,
      'security_violation': <XCircle className="h-3 w-3" />
    };
    return iconMap[category] || <Activity className="h-3 w-3" />;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Enhanced Live Monitoring</h2>
          <Badge className={`${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
            connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' && <Activity className="h-3 w-3 mr-1" />}
            {connectionStatus === 'disconnected' && <XCircle className="h-3 w-3 mr-1" />}
            {connectionStatus === 'connecting' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
            {connectionStatus === 'connected' ? 'Live' : 
             connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? disconnectFromLiveFeed : connectToLiveFeed}
          >
            {isMonitoring ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Live Feed
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.bySeverity.critical ?? 0}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dev Logs</p>
              <p className="text-2xl font-bold text-blue-600">{stats.bySource.dev ?? 0}</p>
            </div>
            <Terminal className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Audit Logs</p>
              <p className="text-2xl font-bold text-green-600">{stats.bySource.audit ?? 0}</p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

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
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="all">All Sources</option>
          <option value="dev">Development</option>
          <option value="audit">Audit/Security</option>
        </select>

        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="all">All Categories</option>
          <option value="api">API</option>
          <option value="database">Database</option>
          <option value="auth">Authentication</option>
          <option value="system">System</option>
          <option value="user_action">User Actions</option>
          <option value="security_violation">Security</option>
        </select>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm w-48"
          />
        </div>

        <Badge variant="outline">{filteredLogs.length} results</Badge>
      </div>

      {/* Live Log Stream */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p>No live events</p>
              <p className="text-sm">
                {isMonitoring ? 'Waiting for new log events...' : 'Start monitoring to see live events'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <Card 
                key={log.id} 
                className="p-4 cursor-pointer transition-all hover:shadow-md"
                onClick={() => toggleLogExpansion(log.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLogExpansion(log.id);
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {expandedLogs.has(log.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </button>
                      
                      {getSeverityIcon(log.severity)}
                      {getSourceIcon(log.source)}
                      
                      <Badge 
                        variant={log.source === 'dev' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {log.source.toUpperCase()}
                      </Badge>
                      
                      <Badge variant="outline" className={`text-xs ${
                        log.severity === 'critical' ? 'border-red-500 text-red-700' : 
                        log.severity === 'high' ? 'border-orange-500 text-orange-700' :
                        log.severity === 'medium' ? 'border-yellow-500 text-yellow-700' :
                        'border-blue-500 text-blue-700'
                      }`}>
                        {log.severity.toUpperCase()}
                      </Badge>

                      <div className="flex items-center gap-1">
                        {getCategoryIcon(String(log.category))}
                        <Badge variant="outline" className="text-xs">
                          {String(log.category).replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1 break-words">
                      {log.message}
                    </h4>

                    {/* Tags */}
                    {log.tags && log.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {log.tags.slice(0, 5).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {log.tags.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{log.tags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Expanded Content */}
                    {expandedLogs.has(log.id) && (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        {/* Context Information */}
                        {log.context && (
                          <div className="bg-muted p-3 rounded border-l-4 border-blue-400">
                            <h5 className="font-semibold text-blue-800 text-sm mb-1">Context</h5>
                            <pre className="text-xs text-blue-700 whitespace-pre-wrap">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Metadata */}
                        {log.metadata && (
                          <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                            <h5 className="font-semibold text-gray-800 text-sm mb-1">Metadata</h5>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Correlation ID */}
                        {log.correlationId && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">Correlation ID:</span>
                            <Badge variant="outline" className="text-xs font-mono">
                              {log.correlationId}
                            </Badge>
                          </div>
                        )}
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
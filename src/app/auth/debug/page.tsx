'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Download, CheckCircle, XCircle, AlertCircle, Shield, Database, Server, Key, User, Activity, Bug, Code, Terminal, Eye, EyeOff } from 'lucide-react';

interface AuthLog {
  id: string;
  timestamp: string;
  type: 'signin_attempt' | 'session_check' | 'token_verify' | 'error' | 'middleware' | 'callback' | 'database' | 'env_check';
  level: 'info' | 'warning' | 'error' | 'debug' | 'critical';
  message: string;
  details: Record<string, unknown>;
  email?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  errorStack?: string;
  allHeaders?: number;
}

interface AuthFlow {
  id: string;
  timestamp: string;
  step: string;
  details: Record<string, unknown>;
}

interface ProcessInfo {
  pid: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  nodeVersion: string;
  platform: string;
  arch: string;
  cwd: string;
  env: Record<string, string | undefined>;
}

interface SystemStatus {
  database: { connected: boolean; message: string; details?: Record<string, unknown> };
  nextAuth: { configured: boolean; message: string; details?: Record<string, unknown> };
  environment: { variables: Record<string, boolean>; message: string };
  session: { active: boolean; user?: Record<string, unknown>; token?: Record<string, unknown> };
  cookies: Record<string, string>;
  headers: Record<string, string>;
}

export default function AuthDebugPage() {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [authFlow, setAuthFlow] = useState<AuthFlow[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [processInfo, setProcessInfo] = useState<ProcessInfo | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showRawData, setShowRawData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('admin@school.edu');
  const [testPassword, setTestPassword] = useState('1234');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'logs' | 'flow' | 'system' | 'process'>('logs');

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/debug-logs', { cache: 'no-store' });
      const data = await response.json();
      setLogs(data.logs || []);
      setAuthFlow(data.authFlow || []);
      setSystemStatus(data.systemStatus || null);
      setProcessInfo(data.processInfo || null);
      
      // Save to localStorage as backup
      if (data.logs && data.logs.length > 0) {
        localStorage.setItem('auth-debug-logs', JSON.stringify(data.logs));
        localStorage.setItem('auth-debug-flow', JSON.stringify(data.authFlow));
        localStorage.setItem('auth-debug-status', JSON.stringify(data.systemStatus));
        localStorage.setItem('auth-debug-process', JSON.stringify(data.processInfo));
        localStorage.setItem('auth-debug-timestamp', new Date().toISOString());
      }
    } catch (error: unknown) {
      console.error('Failed to fetch debug logs:', error);
      
      // Try to load from localStorage if API fails
      const savedLogs = localStorage.getItem('auth-debug-logs');
      const savedFlow = localStorage.getItem('auth-debug-flow');
      const savedStatus = localStorage.getItem('auth-debug-status');
      const savedProcess = localStorage.getItem('auth-debug-process');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
        setAuthFlow(savedFlow ? JSON.parse(savedFlow) : []);
        setSystemStatus(savedStatus ? JSON.parse(savedStatus) : null);
        setProcessInfo(savedProcess ? JSON.parse(savedProcess) : null);
        console.log('Loaded logs from localStorage backup');
      }
    }
  }, []);

  const testSignIn = async () => {
    setIsLoading(true);
    try {
      // First, send credentials to debug API for validation
      await fetch('/api/auth/debug-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signin_attempt',
          level: 'info',
          message: `Starting sign-in test for ${testEmail}`,
          details: { 
            email: testEmail, 
            password: testPassword,
            timestamp: new Date().toISOString() 
          }
        })
      });

      // Try to get CSRF token
      let csrfToken = '';
      try {
        csrfToken = await getCsrfToken();
      } catch (e: unknown) {
        console.error('Failed to get CSRF token:', e);
      }

      // Actual sign-in attempt using NextAuth
      const signInResponse = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          csrfToken: csrfToken
        })
      });

      // Log the NextAuth response
      await fetch('/api/auth/debug-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'callback',
          level: signInResponse.ok ? 'info' : 'error',
          message: `NextAuth response: ${signInResponse.status} ${signInResponse.statusText}`,
          details: {
            status: signInResponse.status,
            statusText: signInResponse.statusText,
            headers: Object.fromEntries(signInResponse.headers.entries()),
            ok: signInResponse.ok,
            redirected: signInResponse.redirected,
            url: signInResponse.url
          }
        })
      });

      // Check session after sign-in
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      await fetch('/api/auth/debug-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'session_check',
          level: sessionData?.user ? 'info' : 'warning',
          message: sessionData?.user ? 'Session created successfully' : 'No session after sign-in',
          details: sessionData
        })
      });

      await fetchLogs();
    } catch (error: unknown) {
      console.error('Test sign-in failed:', error);
      
      // Log the error
      await fetch('/api/auth/debug-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          level: 'error',
          message: 'Test sign-in failed',
          details: { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          }
        })
      });
      
      await fetchLogs();
    } finally {
      setIsLoading(false);
    }
  };

  const getCsrfToken = async () => {
    const response = await fetch('/api/auth/csrf');
    const data = await response.json();
    return data.csrfToken;
  };

  const clearLogs = async () => {
    await fetch('/api/auth/debug-logs', { method: 'DELETE' });
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify({ logs, authFlow, systemStatus, processInfo }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `auth-debug-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };


  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchLogs]);

  const getLevelBadge = (level: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      info: "default",
      warning: "secondary",
      error: "destructive",
      debug: "outline",
      critical: "destructive"
    };
    
    const colors: Record<string, string> = {
      info: "text-blue-600",
      warning: "text-yellow-600",
      error: "text-red-600",
      debug: "text-gray-600",
      critical: "text-red-800"
    };

    return (
      <Badge variant={variants[level] || "outline"} className={colors[level]}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'signin_attempt': return <User className="h-4 w-4" />;
      case 'session_check': return <Shield className="h-4 w-4" />;
      case 'token_verify': return <Key className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'middleware': return <Activity className="h-4 w-4" />;
      case 'callback': return <Code className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'env_check': return <Server className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Bug className="h-6 w-6 text-red-600" />
                  Auth Debug Console
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive authentication debugging and logging
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? <Activity className="h-4 w-4 animate-pulse" /> : <Activity className="h-4 w-4" />}
                  {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                </Button>
                <Button variant="outline" size="sm" onClick={fetchLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={exportLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="destructive" size="sm" onClick={clearLogs}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Simple System Status Table */}
        {systemStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Health Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  {/* Database Status */}
                  <tr className="border-b">
                    <td className="py-2 font-medium w-1/3">Database Connection</td>
                    <td className="py-2">
                      {systemStatus.database.connected ? 
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Connected to Supabase
                        </span> : 
                        <span className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          Not Connected
                        </span>
                      }
                    </td>
                    <td className="py-2 text-gray-600">
                      {String(systemStatus.database.details?.userCount || 0)} users in database
                    </td>
                  </tr>

                  {/* NextAuth Status */}
                  <tr className="border-b">
                    <td className="py-2 font-medium">NextAuth Configuration</td>
                    <td className="py-2">
                      {systemStatus.nextAuth.configured ? 
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Configured
                        </span> : 
                        <span className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          Not Configured
                        </span>
                      }
                    </td>
                    <td className="py-2 text-gray-600">
                      {String(systemStatus.nextAuth.details?.NEXTAUTH_URL || 'URL not set')}
                    </td>
                  </tr>

                  {/* Session Status */}
                  <tr className="border-b">
                    <td className="py-2 font-medium">Current Session</td>
                    <td className="py-2">
                      {systemStatus.session.active ? 
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Active Session
                        </span> : 
                        <span className="flex items-center gap-2 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          No Session
                        </span>
                      }
                    </td>
                    <td className="py-2 text-gray-600">
                      {String(systemStatus.session.user?.email || 'Not logged in')}
                    </td>
                  </tr>

                  {/* Environment Variables */}
                  <tr className="border-b">
                    <td className="py-2 font-medium">Required Env Variables</td>
                    <td className="py-2" colSpan={2}>
                      <div className="flex gap-3 flex-wrap">
                        {Object.entries(systemStatus.environment.variables).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1">
                            {value ? 
                              <CheckCircle className="h-3 w-3 text-green-600" /> : 
                              <XCircle className="h-3 w-3 text-red-600" />
                            }
                            <span className="text-xs">{key}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* Database Details */}
                  {systemStatus.database.details && (
                    <>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Database Details</td>
                      <td className="py-2" colSpan={2}>
                        <span className="text-xs text-gray-600">
                          {String(systemStatus.database.details.host)}:{String(systemStatus.database.details.port)}/{String(systemStatus.database.details.database)}
                          {systemStatus.database.details.pooling ? ` (${String(systemStatus.database.details.pooling)})` : ''}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Database Stats</td>
                      <td className="py-2" colSpan={2}>
                        <span className="text-xs text-gray-600">
                          Users: {String(systemStatus.database.details.userCount)} | 
                          Roles: {String(systemStatus.database.details.roleCount)} | 
                          Schools: {String(systemStatus.database.details.schoolCount)} | 
                          Districts: {String(systemStatus.database.details.districtCount)}
                        </span>
                      </td>
                    </tr>
                    </>
                  )}

                  {/* Cookie Status */}
                  <tr>
                    <td className="py-2 font-medium">Auth Cookies</td>
                    <td className="py-2" colSpan={2}>
                      <div className="flex gap-3">
                        {systemStatus.cookies?.['next-auth.session-token'] ? 
                          <span className="text-xs text-green-600">✓ Session Token</span> : 
                          <span className="text-xs text-red-600">✗ No Session Token</span>
                        }
                        {systemStatus.cookies?.['next-auth.csrf-token'] ? 
                          <span className="text-xs text-green-600">✓ CSRF Token</span> : 
                          <span className="text-xs text-red-600">✗ No CSRF Token</span>
                        }
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Test Sign In */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Test Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <Button onClick={testSignIn} disabled={isLoading}>
                {isLoading ? 'Testing...' : 'Test Sign In'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRawData(!showRawData)}
              >
                {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showRawData ? 'Hide Raw' : 'Show Raw'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <Card>
          <CardHeader>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'logs' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('logs')}
              >
                Logs ({logs.length})
              </Button>
              <Button
                variant={activeTab === 'flow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('flow')}
              >
                Auth Flow ({authFlow.length})
              </Button>
              <Button
                variant={activeTab === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('system')}
              >
                System Details
              </Button>
              <Button
                variant={activeTab === 'process' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('process')}
              >
                Process Info
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Content based on active tab */}
        {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Authentication Logs ({logs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No logs yet. Try signing in or wait for automatic log collection.
                  </AlertDescription>
                </Alert>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium">
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Level</th>
                      <th className="pb-2">Message</th>
                      <th className="pb-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                      <tr
                        className={`border-b ${
                          log.level === 'error' || log.level === 'critical' 
                            ? 'bg-red-50' 
                            : log.level === 'warning' 
                            ? 'bg-yellow-50'
                            : ''
                        }`}
                      >
                        <td className="py-2 text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(log.type)}
                            <span className="text-sm">{log.type.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="py-2">
                          {getLevelBadge(log.level)}
                        </td>
                        <td className="py-2 text-sm">
                          <div>
                            {log.message}
                            {log.email && (
                              <span className="ml-2 text-xs text-gray-500">({log.email})</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2">
                          {log.details && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLogExpansion(log.id)}
                              className="text-xs"
                            >
                              {expandedLogs.has(log.id) ? 'Hide' : 'Show'}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {expandedLogs.has(log.id) && log.details && (
                        <tr>
                          <td colSpan={5} className="py-2 px-4 bg-gray-50">
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                            {log.errorStack && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-red-600">Stack Trace:</p>
                                <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-x-auto text-red-800">
                                  {log.errorStack}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Auth Flow Tab */}
        {activeTab === 'flow' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Authentication Flow Steps ({authFlow.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {authFlow.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No auth flow steps recorded yet. Try signing in to see the flow.
                  </AlertDescription>
                </Alert>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium">
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Step</th>
                      <th className="pb-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authFlow.map((flow) => (
                      <tr key={flow.id} className="border-b">
                        <td className="py-2 text-xs text-gray-500">
                          {new Date(flow.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 text-sm font-medium">
                          {flow.step.replace(/_/g, ' ').toUpperCase()}
                        </td>
                        <td className="py-2">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(flow.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* System Details Tab */}
        {activeTab === 'system' && systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Full System Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Headers ({Object.keys(systemStatus.headers).length})</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(systemStatus.headers, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">Cookies ({Object.keys(systemStatus.cookies).length})</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(systemStatus.cookies, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">NextAuth Configuration</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(systemStatus.nextAuth.details, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">Database Configuration</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(systemStatus.database.details, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Process Info Tab */}
        {activeTab === 'process' && processInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Process Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Process ID:</span> {processInfo.pid}
                </div>
                <div>
                  <span className="font-medium">Uptime:</span> {Math.floor(processInfo.uptime / 60)}m {Math.floor(processInfo.uptime % 60)}s
                </div>
                <div>
                  <span className="font-medium">Node Version:</span> {processInfo.nodeVersion}
                </div>
                <div>
                  <span className="font-medium">Platform:</span> {processInfo.platform} ({processInfo.arch})
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Memory Usage</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(processInfo.memoryUsage, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">Environment</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(processInfo.env, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">Working Directory</h3>
                <p className="text-sm text-gray-600">{processInfo.cwd}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Raw Data Display */}
        {showRawData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify({ logs, authFlow, systemStatus, processInfo }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
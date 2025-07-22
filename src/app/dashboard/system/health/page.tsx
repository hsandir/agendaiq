"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  RefreshCw, 
  Activity,
  Globe,
  Server,
  Clock,
  Zap,
  FileText,
  Database,
  Cpu,
  HardDrive,
  Copy,
  ArrowLeft,
  Wrench
} from "lucide-react";
import Link from "next/link";

interface HealthResult {
  name: string;
  url: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  statusCode: number;
  responseTime: number;
  contentType: string;
  details: any;
  timestamp: string;
}

interface SystemCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  value: string;
}

interface HealthSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  systemChecks?: SystemCheck[];
}

export default function HealthCheckPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<HealthResult[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('quick');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  // Auth check - only admins can access system health
  useEffect(() => {
    if (session && session.user?.staff?.role?.title !== 'Administrator') {
      router.push('/dashboard');
      return;
    }
  }, [session, router]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const copyErrorToClipboard = (result: HealthResult) => {
    const errorText = `
ERROR: ${result.name}
URL: ${result.url}
Status: ${result.status.toUpperCase()}
HTTP Code: ${result.statusCode}
Response Time: ${result.responseTime}ms
Message: ${result.message}
Content-Type: ${result.contentType}
Timestamp: ${new Date(result.timestamp).toLocaleString()}
${result.details.error ? `Error Details: ${result.details.error}` : ''}
${Object.keys(result.details).length > 0 ? `Additional Details: ${JSON.stringify(result.details, null, 2)}` : ''}
    `.trim();
    
    navigator.clipboard.writeText(errorText);
    showNotification('Error details copied to clipboard!');
  };

  const copyAllErrorsToClipboard = () => {
    const errorResults = results.filter(r => r.status === 'error');
    if (errorResults.length === 0) {
      showNotification('No errors to copy');
      return;
    }

    const allErrorsText = `
HEALTH CHECK ERROR REPORT
Generated: ${new Date().toLocaleString()}
Total Errors: ${errorResults.length}
${'='.repeat(50)}

${errorResults.map((result, index) => `
ERROR #${index + 1}: ${result.name}
URL: ${result.url}
HTTP Code: ${result.statusCode}
Response Time: ${result.responseTime}ms
Message: ${result.message}
Content-Type: ${result.contentType}
Timestamp: ${new Date(result.timestamp).toLocaleString()}
${result.details.error ? `Error Details: ${result.details.error}` : ''}
${Object.keys(result.details).length > 0 ? `Additional Details: ${JSON.stringify(result.details, null, 2)}` : ''}
${'-'.repeat(40)}
`).join('')}

END OF REPORT
    `.trim();

    navigator.clipboard.writeText(allErrorsText);
    showNotification(`Copied ${errorResults.length} errors to clipboard!`);
  };

  const runHealthCheck = async (type: 'quick' | 'full' | 'api-only') => {
    try {
      setLoading(true);
      setProgress(0);
      setResults([]);
      setSummary(null);
      setSystemChecks([]);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch(`/api/system/health-check?action=${type}`);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setSummary(data.summary);
        setSystemChecks(data.systemChecks || []);
        setLastCheck(data.timestamp);
        
        const issues = data.summary.failed + data.summary.warnings;
        if (issues === 0) {
          showNotification('All health checks passed successfully!');
        } else {
          showNotification(`Health check completed with ${issues} issues found`);
        }
      } else {
        const error = await response.json();
        showNotification(`Health check failed: ${error.error}`);
      }

    } catch (error) {
      console.error('Health check failed:', error);
      showNotification('Failed to perform health check');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="text-green-600 border-green-600">Success</Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 1000) return 'text-green-600';
    if (time < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    // Run quick check on load
    runHealthCheck('quick');
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Health Check</h1>
          <p className="text-muted-foreground">Monitor page performance and detect errors across the application</p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <Button 
            onClick={() => runHealthCheck(activeTab as any)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Re-run Check
          </Button>
          <Button 
            onClick={async () => {
              try {
                const response = await fetch('/api/system/fix', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'check' })
                });
                if (response.ok) {
                  const data = await response.json();
                  showNotification(`System fix check completed: ${data.message}`);
                  // Re-run health check after fix
                  setTimeout(() => runHealthCheck(activeTab as any), 2000);
                }
              } catch (error) {
                showNotification('Failed to run system fix');
              }
            }}
            variant="default"
            size="sm"
            disabled={loading}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Fix the Error
          </Button>
        </div>
      </div>

      {/* Fixed position notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <Alert key={index} className="bg-background border shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Health Summary */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Checked</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">Pages and endpoints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
              <p className="text-xs text-muted-foreground">Working correctly</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <p className="text-xs text-muted-foreground">Require fixing</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress indicator */}
      {loading && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Running health check...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check Type Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'quick', label: 'Quick Check', icon: Zap, description: 'Critical pages only' },
            { id: 'full', label: 'Full Check', icon: Globe, description: 'All pages + system' },
            { id: 'api-only', label: 'API Check', icon: Server, description: 'API endpoints only' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (!loading) runHealthCheck(tab.id as any);
              }}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-xs opacity-70">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* System Checks */}
      {systemChecks.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Cpu className="w-5 h-5 mr-2" />
              System Performance
            </CardTitle>
            <CardDescription>
              Server performance and resource usage metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {systemChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="font-medium">{check.name}</div>
                      <div className="text-sm text-muted-foreground">{check.message}</div>
                    </div>
                  </div>
                  <div className="text-sm font-mono">{check.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Check Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Health Check Results
            </div>
            <div className="flex items-center gap-2">
              {results.filter(r => r.status === 'error').length > 0 && (
                <Button
                  onClick={copyAllErrorsToClipboard}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Errors
                </Button>
              )}
              {lastCheck && (
                <div className="text-sm text-muted-foreground">
                  Last check: {new Date(lastCheck).toLocaleString()}
                </div>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Detailed results for each page and endpoint tested
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No health check results</p>
              <p className="text-sm">Run a health check to see detailed results</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.status === 'error' ? 'border-red-200 bg-red-50' :
                    result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-muted-foreground">{result.url}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(result.status)}
                      <div className="text-sm">
                        <span className="font-mono">{result.statusCode}</span>
                      </div>
                      <div className={`text-sm font-mono ${getResponseTimeColor(result.responseTime)}`}>
                        {result.responseTime}ms
                      </div>
                      {result.status === 'error' && (
                        <Button
                          onClick={() => copyErrorToClipboard(result)}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm mb-3">{result.message}</div>
                  
                  <div className="text-xs text-muted-foreground space-x-4">
                    <span>Content-Type: {result.contentType}</span>
                    <span>Checked: {new Date(result.timestamp).toLocaleTimeString()}</span>
                    {result.details.contentLength && (
                      <span>Size: {result.details.contentLength} bytes</span>
                    )}
                    {result.details.jsonValid !== undefined && (
                      <span>JSON: {result.details.jsonValid ? 'Valid' : 'Invalid'}</span>
                    )}
                  </div>

                  {result.details.error && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error Details</AlertTitle>
                      <AlertDescription className="font-mono text-xs">
                        {result.details.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
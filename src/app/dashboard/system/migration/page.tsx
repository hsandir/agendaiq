'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FiCode, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiXCircle,
  FiPlay,
  FiEye,
  FiTool,
  FiFileText,
  FiSettings,
  FiZap,
  FiShield,
  FiDatabase,
  FiMonitor
} from 'react-icons/fi';

interface MigrationStatus {
  totalFiles: number;
  needsMigration: number;
  upToDate: number;
  files: {
    needsMigration: string[];
    upToDate: string[];
  };
}

interface SystemError {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  filePath?: string;
  lineNumber?: number;
  autoFixAvailable: boolean;
}

interface DiagnosticReport {
  systemHealth: 'healthy' | 'warning' | 'critical';
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errors: SystemError[];
  fixes: AutoFix[];
  recommendations: string[];
}

interface AutoFix {
  id: string;
  title: string;
  description: string;
  command?: string;
  risk: string;
  estimatedTime: string;
}

export default function SystemMigrationPage() {
  const [activeTab, setActiveTab] = useState('migration');
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{message: string, type: 'success' | 'error' | 'info'}>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = { message, type };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== notification));
    }, 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load migration status
      const migrationResponse = await fetch('/api/system/migrate-auth?action=status');
      if (migrationResponse.ok) {
        const migrationData = await migrationResponse.json();
        setMigrationStatus(migrationData.status);
      }

      // Load diagnostic report
      const diagnosticResponse = await fetch('/api/system/diagnostic?action=quick');
      if (diagnosticResponse.ok) {
        const diagnosticData = await diagnosticResponse.json();
        setDiagnosticReport(diagnosticData.report || {
          systemHealth: diagnosticData.health,
          totalErrors: diagnosticData.errorCount,
          errorsByType: {},
          errorsBySeverity: { critical: diagnosticData.criticalErrors, high: diagnosticData.highErrors },
          errors: [],
          fixes: [],
          recommendations: diagnosticData.recommendations || []
        });
      }

    } catch (error) {
      addNotification('Failed to load system data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async (dryRun: boolean = false) => {
    setActionLoading('migrate');
    try {
      const response = await fetch('/api/system/migrate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'migrate', dryRun })
      });

      const result = await response.json();

      if (response.ok) {
        addNotification(
          dryRun ? 'Migration preview completed' : 'Migration completed successfully',
          'success'
        );
        await loadData(); // Refresh data
      } else {
        addNotification(`Migration failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addNotification('Migration request failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const runDiagnostic = async (type: 'quick' | 'full' = 'full') => {
    setActionLoading('diagnostic');
    try {
      const response = await fetch(`/api/system/diagnostic?action=${type}`);
      const result = await response.json();

      if (response.ok) {
        setDiagnosticReport(result.report);
        addNotification('System diagnostic completed', 'success');
      } else {
        addNotification(`Diagnostic failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addNotification('Diagnostic request failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const applyFix = async (fixId: string) => {
    setActionLoading(`fix-${fixId}`);
    try {
      const response = await fetch('/api/system/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixId })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addNotification('Fix applied successfully', 'success');
        await runDiagnostic('quick'); // Refresh diagnostic data
      } else {
        addNotification(`Fix failed: ${result.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      addNotification('Fix request failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auth': return <FiShield className="h-4 w-4" />;
      case 'typescript': return <FiCode className="h-4 w-4" />;
      case 'import': return <FiFileText className="h-4 w-4" />;
      case 'api': return <FiSettings className="h-4 w-4" />;
      case 'database': return <FiDatabase className="h-4 w-4" />;
      case 'runtime': return <FiMonitor className="h-4 w-4" />;
      default: return <FiAlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading System Analysis...</p>
          <p className="text-sm text-muted-foreground">Checking migration status and system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <Alert key={index} className={`max-w-md shadow-lg ${
            notification.type === 'success' ? 'bg-green-50 border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <FiTool className="mr-3 text-blue-600" />
            System Migration & Diagnostics
          </h1>
          <p className="text-muted-foreground">Auth migration tools and comprehensive system health monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => loadData()} 
            variant="outline" 
            disabled={!!actionLoading}
          >
            <FiRefreshCw className={`mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <FiMonitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getHealthColor(diagnosticReport?.systemHealth || 'unknown')}>
                {diagnosticReport?.systemHealth || 'Unknown'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Overall system status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Migration Status</CardTitle>
            <FiCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {migrationStatus ? `${migrationStatus.needsMigration}/${migrationStatus.totalFiles}` : '0/0'}
            </div>
            <p className="text-xs text-muted-foreground">Files needing migration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Errors</CardTitle>
            <FiAlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {diagnosticReport?.totalErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Critical: {diagnosticReport?.errorsBySeverity?.critical || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Fixes</CardTitle>
            <FiZap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {diagnosticReport?.fixes?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Available fixes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="migration">Auth Migration</TabsTrigger>
          <TabsTrigger value="diagnostic">System Diagnostic</TabsTrigger>
          <TabsTrigger value="errors">Error Details</TabsTrigger>
          <TabsTrigger value="fixes">Auto-Fixes</TabsTrigger>
        </TabsList>

        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiCode className="mr-2" />
                Auth System Migration
              </CardTitle>
              <CardDescription>
                Migrate existing auth patterns to the new standardized system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationStatus && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Migration Progress</span>
                      <span>{migrationStatus.upToDate}/{migrationStatus.totalFiles} files up to date</span>
                    </div>
                    <Progress 
                      value={(migrationStatus.upToDate / migrationStatus.totalFiles) * 100} 
                      className="w-full" 
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2 text-green-700">✅ Up to Date ({migrationStatus.upToDate})</h4>
                      <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground">
                        {migrationStatus.files.upToDate.slice(0, 5).map(file => (
                          <div key={file} className="truncate">{file}</div>
                        ))}
                        {migrationStatus.files.upToDate.length > 5 && (
                          <div>... and {migrationStatus.files.upToDate.length - 5} more</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-orange-700">🔄 Needs Migration ({migrationStatus.needsMigration})</h4>
                      <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground">
                        {migrationStatus.files.needsMigration.slice(0, 5).map(file => (
                          <div key={file} className="truncate">{file}</div>
                        ))}
                        {migrationStatus.files.needsMigration.length > 5 && (
                          <div>... and {migrationStatus.files.needsMigration.length - 5} more</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => runMigration(true)}
                      disabled={!!actionLoading || migrationStatus.needsMigration === 0}
                      variant="outline"
                    >
                      {actionLoading === 'migrate' ? (
                        <FiRefreshCw className="mr-2 animate-spin" />
                      ) : (
                        <FiEye className="mr-2" />
                      )}
                      Preview Changes
                    </Button>
                    
                    <Button
                      onClick={() => runMigration(false)}
                      disabled={!!actionLoading || migrationStatus.needsMigration === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {actionLoading === 'migrate' ? (
                        <FiRefreshCw className="mr-2 animate-spin" />
                      ) : (
                        <FiPlay className="mr-2" />
                      )}
                      Run Migration
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiMonitor className="mr-2" />
                System Health Diagnostic
              </CardTitle>
              <CardDescription>
                Comprehensive system analysis and health monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => runDiagnostic('quick')}
                  disabled={!!actionLoading}
                  variant="outline"
                >
                  {actionLoading === 'diagnostic' ? (
                    <FiRefreshCw className="mr-2 animate-spin" />
                  ) : (
                    <FiZap className="mr-2" />
                  )}
                  Quick Check
                </Button>
                
                <Button
                  onClick={() => runDiagnostic('full')}
                  disabled={!!actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === 'diagnostic' ? (
                    <FiRefreshCw className="mr-2 animate-spin" />
                  ) : (
                    <FiSettings className="mr-2" />
                  )}
                  Full Diagnostic
                </Button>
              </div>

              {diagnosticReport && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${getHealthColor(diagnosticReport.systemHealth).replace('bg-', 'text-').replace('-100', '-600')}`}>
                        {diagnosticReport.systemHealth.toUpperCase()}
                      </div>
                      <p className="text-sm text-muted-foreground">System Health</p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {diagnosticReport.totalErrors}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Errors</p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {diagnosticReport.fixes?.length || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Available Fixes</p>
                    </div>
                  </div>

                  {diagnosticReport.recommendations && diagnosticReport.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">🔍 Recommendations</h4>
                      <ul className="space-y-1">
                        {diagnosticReport.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {diagnosticReport?.errors && diagnosticReport.errors.length > 0 ? (
            <div className="space-y-4">
              {diagnosticReport.errors.map((error) => (
                <Card key={error.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(error.type)}
                        <div>
                          <CardTitle className="text-lg">{error.title}</CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {error.type}
                            </Badge>
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                            {error.autoFixAvailable && (
                              <Badge className="bg-green-100 text-green-800">
                                Auto-fix available
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{error.description}</p>
                    {error.filePath && (
                      <p className="text-xs text-muted-foreground">
                        📁 {error.filePath}{error.lineNumber ? `:${error.lineNumber}` : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">No Errors Found</p>
                <p className="text-sm text-muted-foreground">System is running smoothly!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fixes" className="space-y-4">
          {diagnosticReport?.fixes && diagnosticReport.fixes.length > 0 ? (
            <div className="space-y-4">
              {diagnosticReport.fixes.map((fix) => (
                <Card key={fix.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{fix.title}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge className={
                            fix.risk === 'low' ? 'bg-green-100 text-green-800' :
                            fix.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {fix.risk} risk
                          </Badge>
                          <Badge variant="outline">
                            {fix.estimatedTime}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => applyFix(fix.id)}
                        disabled={!!actionLoading}
                        size="sm"
                      >
                        {actionLoading === `fix-${fix.id}` ? (
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiZap className="w-4 h-4" />
                        )}
                        Apply Fix
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{fix.description}</p>
                    {fix.command && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                        {fix.command}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">No Auto-Fixes Available</p>
                <p className="text-sm text-muted-foreground">All fixable issues have been resolved!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
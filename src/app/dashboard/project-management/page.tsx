'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiPlay, 
  FiPause,
  FiPlus,
  FiFilter,
  FiSearch,
  FiSettings,
  FiZap,
  FiRefreshCw,
  FiMonitor,
  FiShield,
  FiDatabase,
  FiCode,
  FiActivity
} from 'react-icons/fi';

interface ValidationStatus {
  totalRules: number;
  passedRules: number;
  violatedRules: number;
  autoFixableViolations: number;
  lastValidation: string;
  categories: Record<string, any>;
  recentActivity: Array<[string, string]>;
}

interface WorkflowHealth {
  isWatching: boolean;
  enabledRules: number;
  pendingActions: number;
  scheduledJobs: number;
  recentExecutions: number;
  executionStats: any;
}

interface RuleInfo {
  id: string;
  name: string;
  category: string;
  priority: string;
  enforced: boolean;
  autoFix: boolean;
}

interface WorkflowExecution {
  id: string;
  ruleId: string;
  triggeredBy: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  actions: any[];
  metadata: Record<string, any>;
}

export default function ProjectManagementPage() {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | null>(null);
  const [workflowHealth, setWorkflowHealth] = useState<WorkflowHealth | null>(null);
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{message: string, type: 'success' | 'error' | 'info'}>>([]);

  useEffect(() => {
    loadProjectManagementData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadProjectManagementData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadProjectManagementData = async () => {
    try {
      const response = await fetch('/api/project-management/rules');
      const data = await response.json();
      
      if (response.ok) {
        setValidationStatus(data.validationStatus);
        setWorkflowHealth(data.workflowHealth);
        setRules(data.rules);
        setRecentExecutions(data.recentExecutions);
      } else {
        addNotification('Failed to load project management data', 'error');
      }
    } catch (error) {
      console.error('Error loading project management data:', error);
      addNotification('Error loading data. Using demo mode.', 'error');
      
      // Fallback to demo data
      setValidationStatus({
        totalRules: 6,
        passedRules: 4,
        violatedRules: 2,
        autoFixableViolations: 2,
        lastValidation: new Date().toISOString(),
        categories: {
          security: { total: 2, passed: 1, violations: 1 },
          database: { total: 2, passed: 2, violations: 0 },
          workflow: { total: 2, passed: 1, violations: 1 }
        },
        recentActivity: []
      });
      
      setWorkflowHealth({
        isWatching: false,
        enabledRules: 4,
        pendingActions: 0,
        scheduledJobs: 1,
        recentExecutions: 3,
        executionStats: {
          total: 15,
          successful: 12,
          failed: 2,
          running: 1
        }
      });
      
      setRules([
        { id: 'RULE-001', name: 'Prisma Naming Convention', category: 'database', priority: 'critical', enforced: true, autoFix: true },
        { id: 'RULE-002', name: 'Dynamic RBAC Integration', category: 'security', priority: 'high', enforced: true, autoFix: true },
        { id: 'RULE-003', name: 'Import Consistency', category: 'workflow', priority: 'medium', enforced: true, autoFix: true },
        { id: 'RULE-004', name: 'API Authentication', category: 'security', priority: 'critical', enforced: true, autoFix: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = { message, type };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== notification));
    }, 5000);
  };

  const validateRule = async (ruleId: string, autoFix: boolean = false) => {
    setActionLoading(`validate-${ruleId}`);
    try {
      const response = await fetch('/api/project-management/rules/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, autoFix })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const fixesApplied = result.autoFixResult?.appliedFixes || 0;
        addNotification(
          `Rule validated. ${fixesApplied > 0 ? `Applied ${fixesApplied} fixes.` : 'No fixes needed.'}`,
          result.validationResult.passed ? 'success' : 'info'
        );
        
        // Refresh data
        loadProjectManagementData();
      } else {
        addNotification(`Validation failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addNotification('Error validating rule', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const controlWorkflow = async (action: string, ruleId?: string, enabled?: boolean) => {
    setActionLoading(`workflow-${action}`);
    try {
      const response = await fetch('/api/project-management/rules/workflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ruleId, enabled })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        addNotification(result.message, 'success');
        loadProjectManagementData();
      } else {
        addNotification(`Workflow control failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addNotification('Error controlling workflow', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <FiShield className="h-4 w-4" />;
      case 'database': return <FiDatabase className="h-4 w-4" />;
      case 'workflow': return <FiCode className="h-4 w-4" />;
      case 'ui-ux': return <FiMonitor className="h-4 w-4" />;
      default: return <FiSettings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading Project Management System...</p>
          <p className="text-sm text-muted-foreground">Initializing rules engine and workflow system...</p>
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
            <FiCheckCircle className="h-4 w-4" />
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <FiSettings className="mr-3 text-blue-600" />
            Project Management & Rule Engine
          </h1>
          <p className="text-muted-foreground">Comprehensive project tracking with automated rule enforcement</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => loadProjectManagementData()} 
            variant="outline" 
            disabled={!!actionLoading}
          >
            <FiRefreshCw className={`mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => controlWorkflow(workflowHealth?.isWatching ? 'stop' : 'start')} 
            disabled={!!actionLoading}
            className={workflowHealth?.isWatching ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {actionLoading === 'workflow-start' || actionLoading === 'workflow-stop' ? (
              <FiRefreshCw className="mr-2 animate-spin" />
            ) : workflowHealth?.isWatching ? (
              <FiPause className="mr-2" />
            ) : (
              <FiPlay className="mr-2" />
            )}
            {workflowHealth?.isWatching ? 'Stop Watching' : 'Start Watching'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule Validation</CardTitle>
            <FiCheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {validationStatus?.passedRules || 0}/{validationStatus?.totalRules || 0}
            </div>
            <Progress 
              value={validationStatus ? (validationStatus.passedRules / validationStatus.totalRules) * 100 : 0} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {validationStatus?.violatedRules || 0} violations detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Fix Available</CardTitle>
            <FiZap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {validationStatus?.autoFixableViolations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Violations can be automatically fixed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflow Engine</CardTitle>
            <FiActivity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={workflowHealth?.isWatching ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {workflowHealth?.isWatching ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {workflowHealth?.enabledRules || 0} rules enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <FiClock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {workflowHealth?.recentExecutions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Executions in last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Rules & Validation</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Engine</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(rule.category)}
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {rule.id}
                          </Badge>
                          <Badge className={getPriorityColor(rule.priority)}>
                            {rule.priority}
                          </Badge>
                          <Badge variant="outline">
                            {rule.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => validateRule(rule.id, false)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === `validate-${rule.id}` ? (
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiCheckCircle className="w-4 h-4" />
                        )}
                        Validate
                      </Button>
                      {rule.autoFix && (
                        <Button
                          size="sm"
                          onClick={() => validateRule(rule.id, true)}
                          disabled={!!actionLoading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {actionLoading === `validate-${rule.id}` ? (
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <FiZap className="w-4 h-4" />
                          )}
                          Auto-Fix
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={rule.enforced ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {rule.enforced ? 'Enforced' : 'Optional'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Auto-Fix:</span>
                      <Badge className={rule.autoFix ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                        {rule.autoFix ? 'Available' : 'Manual'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiActivity className="mr-2" />
                Workflow Engine Status
              </CardTitle>
              <CardDescription>Real-time file watching and automated rule enforcement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">File Watching</span>
                    <Badge className={workflowHealth?.isWatching ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {workflowHealth?.isWatching ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enabled Rules</span>
                    <span className="text-sm font-medium">{workflowHealth?.enabledRules || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Actions</span>
                    <span className="text-sm font-medium">{workflowHealth?.pendingActions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scheduled Jobs</span>
                    <span className="text-sm font-medium">{workflowHealth?.scheduledJobs || 0}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Execution Statistics</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Executions</span>
                    <span className="text-sm font-medium">{workflowHealth?.executionStats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Successful</span>
                    <span className="text-sm font-medium text-green-600">{workflowHealth?.executionStats?.successful || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed</span>
                    <span className="text-sm font-medium text-red-600">{workflowHealth?.executionStats?.failed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Currently Running</span>
                    <span className="text-sm font-medium text-blue-600">{workflowHealth?.executionStats?.running || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Executions</CardTitle>
              <CardDescription>Latest automated rule enforcement activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentExecutions.length > 0 ? (
                <div className="space-y-4">
                  {recentExecutions.map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={
                          execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                          execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                          execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {execution.status}
                        </Badge>
                        <div>
                          <div className="font-medium">{execution.ruleId}</div>
                          <div className="text-sm text-muted-foreground">
                            Triggered by: {execution.triggeredBy}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(execution.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent executions found</p>
                  <p className="text-sm text-gray-400">Workflow executions will appear here when the engine is active</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Rule distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                {validationStatus?.categories ? (
                  <div className="space-y-3">
                    {Object.entries(validationStatus.categories).map(([category, stats]: [string, any]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600">{stats.passed}</span>
                          <span className="text-sm text-gray-400">/</span>
                          <span className="text-sm">{stats.total}</span>
                          {stats.violations > 0 && (
                            <Badge className="bg-red-100 text-red-800 ml-2">
                              {stats.violations} issues
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No category data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall project management system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rule Engine</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Project Tracker</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Code Generator</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflow Engine</span>
                    <Badge className={workflowHealth?.isWatching ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {workflowHealth?.isWatching ? 'Active' : 'Standby'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dynamic RBAC</span>
                    <Badge className="bg-green-100 text-green-800">Full Mode</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
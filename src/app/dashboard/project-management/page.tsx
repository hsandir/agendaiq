'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  FiRefreshCw
} from 'react-icons/fi';

interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface RuleValidationSummary {
  totalRules: number;
  passedRules: number;
  violatedRules: number;
  autoFixableViolations: number;
}

export default function ProjectManagementPage() {
  const [stats, setStats] = useState<ProjectStats>({
    total: 5,
    completed: 2,
    inProgress: 2,
    pending: 1,
    blocked: 0,
    critical: 1,
    high: 2,
    medium: 2,
    low: 0
  });
  
  const [ruleValidation, setRuleValidation] = useState<RuleValidationSummary>({
    totalRules: 5,
    passedRules: 3,
    violatedRules: 2,
    autoFixableViolations: 2
  });
  
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(m => m !== message));
    }, 5000);
  };

  const handleAutoFix = async () => {
    setLoading(true);
    try {
      // Simulate auto-fix process
      await new Promise(resolve => setTimeout(resolve, 2000));
      addNotification('Auto-fix simulation completed - 2 issues would be fixed');
      
      // Update validation stats
      setRuleValidation(prev => ({
        ...prev,
        passedRules: prev.totalRules,
        violatedRules: 0,
        autoFixableViolations: 0
      }));
      
    } catch (error) {
      console.error('Auto-fix failed:', error);
      addNotification('Auto-fix simulation failed. This is just a demo.');
    } finally {
      setLoading(false);
    }
  };

  const validateRules = async () => {
    setLoading(true);
    try {
      // Simulate rule validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      addNotification('Rule validation simulation completed');
    } catch (error) {
      console.error('Rule validation failed:', error);
      addNotification('Rule validation simulation failed. This is just a demo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Project Management System</p>
          <p className="text-sm text-muted-foreground">Demo version - simulating operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <Alert key={index} className="max-w-md bg-background border shadow-lg">
            <FiCheckCircle className="h-4 w-4" />
            <AlertDescription>{notification}</AlertDescription>
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
          <p className="text-muted-foreground">Track tasks, enforce rules, and automate development workflow</p>
          <div className="mt-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              Demo Mode - System is being built
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={validateRules} variant="outline" disabled={loading}>
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Validate Rules
          </Button>
          <Button 
            onClick={handleAutoFix} 
            disabled={loading || ruleValidation.autoFixableViolations === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <FiRefreshCw className="mr-2 animate-spin" />
            ) : (
              <FiZap className="mr-2" />
            )}
            Auto-Fix ({ruleValidation.autoFixableViolations})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
            <FiCheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total} Tasks</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completed} completed ({((stats.completed / stats.total) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <FiPlay className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} pending, {stats.blocked} blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule Validation</CardTitle>
            <FiSettings className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ruleValidation.passedRules}/{ruleValidation.totalRules}</div>
            <p className="text-xs text-muted-foreground">
              {ruleValidation.violatedRules} violations detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Priority</CardTitle>
            <FiAlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              {stats.high} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rule Validation Status */}
      {ruleValidation.violatedRules > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <FiAlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Rule Violations Detected:</strong> {ruleValidation.violatedRules} rules are currently violated. 
            {ruleValidation.autoFixableViolations > 0 && (
              <span> {ruleValidation.autoFixableViolations} can be automatically fixed.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FiSettings className="mr-2" />
              System Components
            </CardTitle>
            <CardDescription>Status of project management system components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Rule Engine</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Project Tracker</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Code Generator</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Workflow Engine</span>
              <Badge className="bg-yellow-100 text-yellow-800">Demo Mode</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dynamic RBAC</span>
              <Badge className="bg-yellow-100 text-yellow-800">Simple Mode</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FiZap className="mr-2" />
              Available Actions
            </CardTitle>
            <CardDescription>Actions you can perform with the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={validateRules} 
              variant="outline" 
              className="w-full justify-start"
              disabled={loading}
            >
              <FiRefreshCw className="mr-2" />
              Validate All Rules
            </Button>
            <Button 
              onClick={handleAutoFix} 
              variant="outline" 
              className="w-full justify-start"
              disabled={loading || ruleValidation.autoFixableViolations === 0}
            >
              <FiZap className="mr-2" />
              Apply Auto-Fixes
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled
            >
              <FiPlay className="mr-2" />
              Start File Watching (Coming Soon)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled
            >
              <FiSettings className="mr-2" />
              Configure Rules (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Demo Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FiAlertCircle className="mr-2 text-blue-600" />
            Demo Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Current Status:</strong> Project Management System is in development phase</p>
            <p>• <strong>Working Components:</strong> Basic UI, stats display, rule validation simulation</p>
            <p>• <strong>In Progress:</strong> Rule engine integration, file watching, auto-fix mechanisms</p>
            <p>• <strong>Next Steps:</strong> Complete Prisma field fixes, implement full RBAC, add real rule validation</p>
            <p>• <strong>Demo Features:</strong> All buttons and actions are simulated for demonstration</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { ProjectTracker, ProjectTask } from '@/lib/project-management/project-tracker';
import { RuleEngine } from '@/lib/project-management/rule-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [ruleValidation, setRuleValidation] = useState<RuleValidationSummary>({
    totalRules: 0,
    passedRules: 0,
    violatedRules: 0,
    autoFixableViolations: 0
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoFixing, setAutoFixing] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    try {
      // Initialize project tracker
      const tracker = ProjectTracker.getInstance();
      await tracker.initialize();
      
      // Initialize rule engine
      const ruleEngine = RuleEngine.getInstance();
      
      // Load tasks and validate rules
      await Promise.all([
        loadTasks(),
        validateProjectRules()
      ]);
      
    } catch (error) {
      console.error('Failed to initialize system:', error);
      addNotification('System initialization failed. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    const tracker = ProjectTracker.getInstance();
    const allTasks = tracker.getAllTasks();
    setTasks(allTasks);
    calculateStats(allTasks);
  };

  const validateProjectRules = async () => {
    try {
      const ruleEngine = RuleEngine.getInstance();
      const results = await ruleEngine.validateAllRules();
      
      const summary: RuleValidationSummary = {
        totalRules: results.length,
        passedRules: results.filter(r => r.passed).length,
        violatedRules: results.filter(r => !r.passed).length,
        autoFixableViolations: results
          .filter(r => !r.passed)
          .reduce((sum, r) => sum + r.fixes.filter(f => f.autoApply).length, 0)
      };
      
      setRuleValidation(summary);
      
      if (summary.violatedRules > 0) {
        addNotification(`Found ${summary.violatedRules} rule violations. ${summary.autoFixableViolations} can be auto-fixed.`);
      }
    } catch (error) {
      console.error('Rule validation failed:', error);
      addNotification('Rule validation failed. Some issues may not be detected.');
    }
  };

  const calculateStats = (taskList: ProjectTask[]) => {
    const stats: ProjectStats = {
      total: taskList.length,
      completed: taskList.filter(t => t.status === 'completed').length,
      inProgress: taskList.filter(t => t.status === 'in-progress').length,
      pending: taskList.filter(t => t.status === 'pending').length,
      blocked: taskList.filter(t => t.status === 'blocked').length,
      critical: taskList.filter(t => t.priority === 'critical').length,
      high: taskList.filter(t => t.priority === 'high').length,
      medium: taskList.filter(t => t.priority === 'medium').length,
      low: taskList.filter(t => t.priority === 'low').length
    };
    setStats(stats);
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(m => m !== message));
    }, 5000);
  };

  const handleAutoFix = async () => {
    setAutoFixing(true);
    try {
      const ruleEngine = RuleEngine.getInstance();
      const result = await ruleEngine.autoFixAllViolations();
      
      addNotification(`Auto-fix completed: ${result.appliedFixes} fixes applied, ${result.failedFixes} failed.`);
      
      // Refresh validation after auto-fix
      await validateProjectRules();
      
    } catch (error) {
      console.error('Auto-fix failed:', error);
      addNotification('Auto-fix failed. Please check the console for details.');
    } finally {
      setAutoFixing(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const categoryMatch = selectedCategory === 'all' || task.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categoryMatch && statusMatch && searchMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="text-green-500" />;
      case 'in-progress': return <FiPlay className="text-blue-500" />;
      case 'blocked': return <FiAlertCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Initializing Project Management System...</p>
          <p className="text-sm text-muted-foreground">Loading tasks and validating rules...</p>
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
        </div>
        <div className="flex gap-2">
          <Button onClick={validateProjectRules} variant="outline">
            <FiRefreshCw className="mr-2" />
            Validate Rules
          </Button>
          <Button 
            onClick={handleAutoFix} 
            disabled={autoFixing || ruleValidation.autoFixableViolations === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {autoFixing ? (
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
            <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completed} completed ({stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%)
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

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="security">Security</option>
              <option value="ui-ux">UI/UX</option>
              <option value="database">Database</option>
              <option value="api">API</option>
              <option value="testing">Testing</option>
              <option value="deployment">Deployment</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({stats.critical})</TabsTrigger>
          <TabsTrigger value="security">Security ({tasks.filter(t => t.category === 'security').length})</TabsTrigger>
          <TabsTrigger value="database">Database ({tasks.filter(t => t.category === 'database').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={loadTasks} />
          ))}
          {filteredTasks.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <FiCheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tasks found matching your criteria.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          {filteredTasks.filter(t => t.priority === 'critical').map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={loadTasks} />
          ))}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {filteredTasks.filter(t => t.category === 'security').map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={loadTasks} />
          ))}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          {filteredTasks.filter(t => t.category === 'database').map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={loadTasks} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onUpdate }: { task: ProjectTask; onUpdate: () => void }) {
  const tracker = ProjectTracker.getInstance();

  const handleStatusChange = async (newStatus: ProjectTask['status']) => {
    try {
      await tracker.updateTask(task.id, { status: newStatus }, 'current-user', 'Status updated');
      onUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="text-green-500" />;
      case 'in-progress': return <FiPlay className="text-blue-500" />;
      case 'blocked': return <FiAlertCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(task.status)}
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {task.id}
              </Badge>
            </div>
            <CardDescription>{task.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge variant="outline">
              {task.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Files */}
          {task.files.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Affected Files:</p>
              <div className="text-xs text-gray-500 space-y-1">
                {task.files.slice(0, 3).map((file) => (
                  <div key={file} className="font-mono bg-gray-50 p-1 rounded text-xs">
                    {file}
                  </div>
                ))}
                {task.files.length > 3 && (
                  <div className="text-gray-400">+{task.files.length - 3} more files</div>
                )}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Dependencies:</p>
              <div className="text-xs text-gray-500">
                {task.dependencies.join(', ')}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {task.status === 'pending' && (
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('in-progress')}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <FiPlay className="mr-1 w-3 h-3" />
                Start
              </Button>
            )}
            {task.status === 'in-progress' && (
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('completed')}
                className="bg-green-500 hover:bg-green-600"
              >
                <FiCheckCircle className="mr-1 w-3 h-3" />
                Complete
              </Button>
            )}
            {task.status === 'blocked' && (
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('in-progress')}
                variant="outline"
              >
                <FiPlay className="mr-1 w-3 h-3" />
                Unblock
              </Button>
            )}
            <Button size="sm" variant="outline">
              <FiSettings className="mr-1 w-3 h-3" />
              Edit
            </Button>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-400 pt-2 border-t">
            Last updated: {task.updatedAt.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
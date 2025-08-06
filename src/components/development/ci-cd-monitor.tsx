'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import AutofixModal from './autofix-modal';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  PlayCircle,
  Clock,
  GitBranch,
  User,
  Zap,
  AlertTriangle,
  Settings,
  Mail,
  BellOff,
  Bell,
  Wrench,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileCode,
  Bug
} from 'lucide-react';

interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  run_number: number;
  event: string;
  failedJobs?: Array<{
    id: number;
    name: string;
    conclusion: string;
    html_url: string;
    logs?: string;
    failedSteps?: Array<{
      name: string;
      conclusion: string;
    }>;
  }>;
}

interface AutofixSuggestion {
  id: string;
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  commands: string[];
  files: Array<{
    path: string;
    action: string;
  }>;
  preventive: boolean;
}

interface Stats {
  total: number;
  successful: number;
  failed: number;
  inProgress: number;
  queued: number;
  successRate: string;
  averageDuration: string;
  commonErrors: Record<string, number>;
}

export default function CICDMonitor() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [autofixSuggestions, setAutofixSuggestions] = useState<AutofixSuggestion[]>([]);
  const [applyingFix, setApplyingFix] = useState(false);
  const [expandedRuns, setExpandedRuns] = useState<Set<number>>(new Set());
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'failure' | 'success'>('all');
  const [usingMockData, setUsingMockData] = useState(false);
  const [activeTab, setActiveTab] = useState('runs');
  const [showAutofixModal, setShowAutofixModal] = useState(false);
  const [autoFixOnFailure, setAutoFixOnFailure] = useState(false);

  const fetchRuns = async () => {
    try {
      const response = await fetch(`/api/dev/ci-cd/runs?status=${filterStatus}&limit=50`);
      
      // Always read the response body once
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 500 && data.code === 'MISSING_GITHUB_TOKEN') {
          console.info('GitHub token not configured, using mock data');
          setUsingMockData(true);
          // Don't throw error, the API returns mock data
          return;
        } else {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
      }
      
      // Check if we're using mock data based on the run URLs
      if (data.runs && data.runs.length > 0 && data.runs[0].url === '#') {
        setUsingMockData(true);
      } else {
        setUsingMockData(false);
      }
      
      setRuns(data.runs || []);
      setStats(data.stats || null);
      
      // Auto-expand failed runs
      if (data.runs && data.runs.length > 0) {
        const failedRunIds = data.runs
          .filter((r: WorkflowRun) => r.conclusion === 'failure')
          .map((r: WorkflowRun) => r.id);
        setExpandedRuns(new Set(failedRunIds.slice(0, 3)));
      }
    } catch (error) {
      console.error('Error fetching CI/CD runs:', error);
      // Set empty data on error
      setRuns([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAutofixSuggestions = async (run: WorkflowRun) => {
    if (!run.failedJobs || run.failedJobs.length === 0) return;

    try {
      const errorType = detectErrorType(run.failedJobs[0]);
      const errorMessage = extractErrorMessage(run.failedJobs[0]);
      
      const response = await fetch(
        `/api/dev/ci-cd/autofix?errorType=${encodeURIComponent(errorType)}&errorMessage=${encodeURIComponent(errorMessage)}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch autofix suggestions');
      
      const data = await response.json();
      setAutofixSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching autofix suggestions:', error);
      setAutofixSuggestions([]);
    }
  };

  const applyAutofix = async (suggestion: AutofixSuggestion, dryRun = true) => {
    setApplyingFix(true);
    try {
      const response = await fetch('/api/dev/ci-cd/autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          errorType: detectErrorType(selectedRun?.failedJobs?.[0]),
          errorMessage: extractErrorMessage(selectedRun?.failedJobs?.[0]),
          dryRun,
        }),
      });

      if (!response.ok) throw new Error('Failed to apply autofix');
      
      const result = await response.json();
      
      if (result.success) {
        alert(dryRun 
          ? `Dry run successful! Would apply: ${suggestion.title}` 
          : `Successfully applied fix: ${suggestion.title}`
        );
        
        if (!dryRun) {
          // Refresh runs after applying fix
          await fetchRuns();
        }
      } else {
        alert(`Failed to apply fix: ${result.results.failed.map((f: any) => f.error).join(', ')}`);
      }
    } catch (error) {
      console.error('Error applying autofix:', error);
      alert('Failed to apply autofix');
    } finally {
      setApplyingFix(false);
    }
  };

  const retryRun = async (runId: number) => {
    try {
      const response = await fetch('/api/dev/ci-cd/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', runId }),
      });

      if (!response.ok) throw new Error('Failed to retry run');
      
      alert('Workflow run retry initiated');
      await fetchRuns();
    } catch (error) {
      console.error('Error retrying run:', error);
      alert('Failed to retry run');
    }
  };

  useEffect(() => {
    fetchRuns();
    
    if (autoRefresh) {
      const interval = setInterval(fetchRuns, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filterStatus]);

  // Auto-fix on failure detection
  useEffect(() => {
    if (autoFixOnFailure && runs.some(r => r.conclusion === 'failure')) {
      const recentFailures = runs.filter(r => {
        const runTime = new Date(r.created_at).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return r.conclusion === 'failure' && runTime > fiveMinutesAgo;
      });
      
      if (recentFailures.length > 0) {
        console.log('Auto-fix triggered for recent failures:', recentFailures);
        setShowAutofixModal(true);
      }
    }
  }, [runs, autoFixOnFailure]);

  useEffect(() => {
    if (selectedRun && selectedRun.conclusion === 'failure') {
      fetchAutofixSuggestions(selectedRun);
    }
  }, [selectedRun]);

  const detectErrorType = (job: any): string => {
    if (!job) return 'Unknown Error';
    
    const logs = job.logs || '';
    const name = job.name.toLowerCase();
    
    if (logs.includes('npm ERR!') || name.includes('install')) return 'NPM Error';
    if (logs.includes('TypeError:')) return 'Type Error';
    if (logs.includes('SyntaxError:')) return 'Syntax Error';
    if (logs.includes('Cannot find module')) return 'Module Not Found';
    if (logs.includes('Test failed') || name.includes('test')) return 'Test Failure';
    if (logs.includes('Build failed') || name.includes('build')) return 'Build Failure';
    if (logs.includes('Lint error') || name.includes('lint')) return 'Lint Error';
    if (logs.includes('Type check failed')) return 'TypeScript Error';
    
    return 'Unknown Error';
  };

  const extractErrorMessage = (job: any): string => {
    if (!job || !job.logs) return '';
    
    const lines = job.logs.split('\n');
    const errorLines = lines.filter(line => 
      line.includes('Error:') || 
      line.includes('ERROR') || 
      line.includes('Failed')
    );
    
    return errorLines.slice(0, 3).join('\n');
  };

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'in_progress') return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === 'queued') return <Clock className="h-4 w-4 text-gray-500" />;
    if (conclusion === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (conclusion === 'failure') return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: string, conclusion: string | null) => {
    if (status === 'in_progress') return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
    if (status === 'queued') return <Badge className="bg-gray-100 text-gray-800">Queued</Badge>;
    if (conclusion === 'success') return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    if (conclusion === 'failure') return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Unknown</Badge>;
  };

  const toggleRunExpansion = (runId: number) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRuns(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">CI/CD Monitor</h2>
          <p className="text-sm text-gray-600">Monitor and fix GitHub Actions workflows</p>
        </div>
        <div className="flex gap-2">
          {runs.some(r => r.conclusion === 'failure') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowAutofixModal(true)}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Fix the Errors
            </Button>
          )}
          <Button
            variant={emailNotifications ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEmailNotifications(!emailNotifications)}
          >
            {emailNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {emailNotifications ? 'Notifications ON' : 'Notifications OFF'}
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
        </div>
      </div>

      {/* Mock Data Notice */}
      {usingMockData && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Using Mock Data</p>
              <p className="text-xs text-yellow-700">
                GitHub token not configured. Add GITHUB_TOKEN to your .env.local file to see real workflow data.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
            >
              Get Token
            </Button>
          </div>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Runs</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-xl font-bold">{stats.averageDuration}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-gray-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Common Error Patterns */}
      {stats && Object.keys(stats.commonErrors).length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Common Error Patterns</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.commonErrors).map(([type, count]) => (
              <Badge key={type} variant="outline" className="px-3 py-1">
                <Bug className="h-3 w-3 mr-1" />
                {type}: {count}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">Workflow Runs</TabsTrigger>
          <TabsTrigger value="autofix">Auto-Fix Center</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All Runs
            </Button>
            <Button
              variant={filterStatus === 'failure' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('failure')}
            >
              Failed Only
            </Button>
            <Button
              variant={filterStatus === 'success' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('success')}
            >
              Successful Only
            </Button>
          </div>

          {/* Workflow Runs List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {runs.map((run) => (
                <Card key={run.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleRunExpansion(run.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedRuns.has(run.id) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </button>
                        {getStatusIcon(run.status, run.conclusion)}
                        <span className="font-semibold">{run.name}</span>
                        {getStatusBadge(run.status, run.conclusion)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-7">
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {run.head_branch}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {run.actor.login}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(run.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Expanded content */}
                      {expandedRuns.has(run.id) && run.failedJobs && run.failedJobs.length > 0 && (
                        <div className="mt-4 ml-7 space-y-2">
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <h4 className="font-semibold text-red-800 mb-2">Failed Jobs:</h4>
                            {run.failedJobs.map((job) => (
                              <div key={job.id} className="mb-2">
                                <p className="text-sm font-medium text-red-700">{job.name}</p>
                                {job.failedSteps && job.failedSteps.length > 0 && (
                                  <ul className="mt-1 ml-4 text-xs text-red-600">
                                    {job.failedSteps.map((step, idx) => (
                                      <li key={idx}>• {step.name}</li>
                                    ))}
                                  </ul>
                                )}
                                {job.logs && (
                                  <pre className="mt-2 p-2 bg-gray-900 text-gray-100 text-xs rounded overflow-x-auto">
                                    {job.logs.split('\n').slice(-10).join('\n')}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {run.conclusion === 'failure' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRun(run)}
                          >
                            <Wrench className="h-4 w-4 mr-1" />
                            Auto-fix
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryRun(run.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(run.html_url, '_blank')}
                      >
                        <Terminal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="autofix" className="space-y-4">
          {selectedRun ? (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Selected Failed Run</h3>
                <div className="text-sm text-gray-600">
                  <p><strong>Workflow:</strong> {selectedRun.name}</p>
                  <p><strong>Branch:</strong> {selectedRun.head_branch}</p>
                  <p><strong>Error Type:</strong> {detectErrorType(selectedRun.failedJobs?.[0])}</p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Suggested Fixes</h3>
                <div className="space-y-3">
                  {autofixSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{suggestion.title}</h4>
                            <Badge 
                              className={
                                suggestion.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {suggestion.confidence} confidence
                            </Badge>
                            {suggestion.preventive && (
                              <Badge className="bg-blue-100 text-blue-800">Preventive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                          
                          {suggestion.commands.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-700">Commands:</p>
                              <pre className="mt-1 p-2 bg-gray-100 text-xs rounded overflow-x-auto">
                                {suggestion.commands.join('\n')}
                              </pre>
                            </div>
                          )}
                          
                          {suggestion.files.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-700">File changes:</p>
                              <ul className="mt-1 text-xs text-gray-600">
                                {suggestion.files.map((file, idx) => (
                                  <li key={idx}>
                                    <FileCode className="h-3 w-3 inline mr-1" />
                                    {file.action} {file.path}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applyAutofix(suggestion, true)}
                            disabled={applyingFix}
                          >
                            Dry Run
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => applyAutofix(suggestion, false)}
                            disabled={applyingFix}
                          >
                            {applyingFix ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                            Apply Fix
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a failed workflow run to see auto-fix suggestions</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">CI/CD Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email alerts for failed workflows</p>
                </div>
                <Button
                  variant={emailNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                >
                  {emailNotifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-fix on Failure</p>
                  <p className="text-sm text-gray-600">Automatically attempt to fix common errors</p>
                </div>
                <Button 
                  variant={autoFixOnFailure ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setAutoFixOnFailure(!autoFixOnFailure)}
                >
                  {autoFixOnFailure ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Slack Integration</p>
                  <p className="text-sm text-gray-600">Send notifications to Slack channel</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">GitHub Token</p>
                  <p className="text-sm text-gray-600">Configure GitHub access token for API calls</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Update Token
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Auto-fix Preferences</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Allow NPM dependency updates</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Allow ESLint auto-fixes</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Allow Prettier formatting</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Allow database migrations</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Auto-commit fixes to git</span>
              </label>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Autofix Modal */}
      <AutofixModal
        isOpen={showAutofixModal}
        onClose={() => setShowAutofixModal(false)}
        type="cicd"
        failedItems={runs.filter(r => r.conclusion === 'failure')}
      />
    </div>
  );
}
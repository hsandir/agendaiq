'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  GitMerge,
  RefreshCw,
  Plus,
  Check,
  X,
  FileText,
  FolderOpen,
  Download,
  Upload,
  Terminal,
  Clock,
  User,
  Hash,
  AlertCircle,
  ChevronRight,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  Save
} from 'lucide-react';

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  deleted: string[];
}

interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  files: number;
  insertions: number;
  deletions: number;
}

interface Branch {
  name: string;
  current: boolean;
  remote: boolean;
  lastCommit: string;
  ahead: number;
  behind: number;
}

interface FileChange {
  path: string;
  status: 'M' | 'A' | 'D' | 'R' | 'U' | '??';
  additions: number;
  deletions: number;
}

export default function GitOperations() {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  useEffect(() => {
    loadGitStatus();
    loadCommitHistory();
    loadBranches();
  }, []);

  const loadGitStatus = async () => {
    try {
      const response = await fetch('/api/dev/git/status');
      const data = await response.json();
      setGitStatus(data.status);
      setFileChanges(data.changes || []);
    } catch (error: unknown) {
      console.error('Failed to load git status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommitHistory = async () => {
    try {
      const response = await fetch('/api/dev/git/commits?limit=50');
      const data = await response.json();
      setCommits(data.commits || []);
    } catch (error: unknown) {
      console.error('Failed to load commit history:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await fetch('/api/dev/git/branches');
      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error: unknown) {
      console.error('Failed to load branches:', error);
    }
  };

  const executeGitCommand = async (command: string, args: string[] = []) => {
    try {
      const response = await fetch('/api/dev/git/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, args })
      });
      
      const data = await response.json();
      
      if (data.output) {
        setTerminalOutput(prev => [...prev, `$ git ${command} ${args.join(' ')}`, data.output]);
      }
      
      return data;
    } catch (error: unknown) {
      console.error('Git command failed:', error);
      setTerminalOutput(prev => [...prev, `Error: ${error}`]);
      return { success: false, error };
    }
  };

  const handleStageFile = async (file: string) => {
    const result = await executeGitCommand('add', [file]);
    if (result.success) {
      await loadGitStatus();
      setSelectedFiles(prev => new Set([...prev, file]));
    }
  };

  const handleUnstageFile = async (file: string) => {
    const result = await executeGitCommand('reset', ['HEAD', file]);
    if (result.success) {
      await loadGitStatus();
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file);
        return newSet;
      });
    }
  };

  const handleCommit = async () => {
    if (!String(commitMessage).trim()) {
      alert('Please enter a commit message');
      return;
    }

    setIsCommitting(true);
    try {
      // Stage selected files
      for (const file of selectedFiles) {
        await executeGitCommand('add', [file]);
      }

      // Commit
      const result = await executeGitCommand('commit', ['-m', commitMessage]);
      
      if (result.success) {
        setCommitMessage('');
        setSelectedFiles(new Set());
        await loadGitStatus();
        await loadCommitHistory();
        alert('Changes committed successfully!');
      }
    } catch (error: unknown) {
      console.error('Commit failed:', error);
      alert('Failed to commit changes');
    } finally {
      setIsCommitting(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    try {
      const result = await executeGitCommand('push', ['origin', gitStatus?.branch || 'main']);
      if (result.success) {
        await loadGitStatus();
        alert('Changes pushed successfully!');
      }
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    try {
      const result = await executeGitCommand('pull', ['origin', gitStatus?.branch || 'main']);
      if (result.success) {
        await loadGitStatus();
        await loadCommitHistory();
        alert('Changes pulled successfully!');
      }
    } finally {
      setIsPulling(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!String(newBranchName).trim()) {
      alert('Please enter a branch name');
      return;
    }

    const result = await executeGitCommand('checkout', ['-b', newBranchName]);
    if (result.success) {
      setNewBranchName('');
      await loadBranches();
      await loadGitStatus();
      alert(`Branch '${newBranchName}' created and checked out!`);
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    const result = await executeGitCommand('checkout', [branchName]);
    if (result.success) {
      await loadGitStatus();
      await loadBranches();
      await loadCommitHistory();
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (confirm(`Are you sure you want to delete branch '${branchName}'?`)) {
      const result = await executeGitCommand('branch', ['-d', branchName]);
      if (result.success) {
        await loadBranches();
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'M': return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'A': return <Plus className="h-4 w-4 text-green-500" />;
      case 'D': return <Trash2 className="h-4 w-4 text-destructive" />;
      case '??': return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'M': return 'Modified';
      case 'A': return 'Added';
      case 'D': return 'Deleted';
      case 'R': return 'Renamed';
      case '??': return 'Untracked';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Git Operations</h2>
          <p className="text-sm text-muted-foreground">Version control management</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePull}
            disabled={isPulling}
          >
            {isPulling ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Pull
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePush}
            disabled={isPushing || (gitStatus?.ahead || 0) === 0}
          >
            {isPushing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Push {gitStatus?.ahead ? `(${gitStatus.ahead})` : ''}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadGitStatus();
              loadCommitHistory();
              loadBranches();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Current Branch Status */}
      {gitStatus && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                <CardTitle className="text-lg">{gitStatus.branch}</CardTitle>
                <Badge variant="outline">Current Branch</Badge>
              </div>
              <div className="flex gap-2 text-sm">
                {gitStatus.ahead > 0 && (
                  <Badge variant="default">
                    ↑ {gitStatus.ahead} ahead
                  </Badge>
                )}
                {gitStatus.behind > 0 && (
                  <Badge variant="destructive">
                    ↓ {gitStatus.behind} behind
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Staged:</span>
                <span className="ml-2 font-medium">{gitStatus.staged.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified:</span>
                <span className="ml-2 font-medium">{gitStatus.modified.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Untracked:</span>
                <span className="ml-2 font-medium">{gitStatus.untracked.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Deleted:</span>
                <span className="ml-2 font-medium">{gitStatus.deleted.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="status">Changes</TabsTrigger>
          <TabsTrigger value="commits">History</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
        </TabsList>

        {/* Changes Tab */}
        <TabsContent value="status" className="space-y-4">
          {/* Commit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Commit Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter commit message..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCommit()}
                />
                <Button
                  onClick={handleCommit}
                  disabled={isCommitting || selectedFiles.size === 0}
                >
                  {isCommitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitCommit className="h-4 w-4" />
                  )}
                  Commit ({selectedFiles.size})
                </Button>
              </div>

              {/* File Changes */}
              <div className="space-y-2">
                <h3 className="font-medium">File Changes</h3>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {fileChanges.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.path)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles(prev => new Set([...prev, file.path]));
                                handleStageFile(file.path);
                              } else {
                                setSelectedFiles(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(file.path);
                                  return newSet;
                                });
                                handleUnstageFile(file.path);
                              }
                            }}
                          />
                          {getStatusIcon(file.status)}
                          <span className="text-sm font-mono">{file.path}</span>
                          <Badge variant="outline" className="text-xs">
                            {getStatusLabel(file.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600">+{file.additions}</span>
                          <span className="text-destructive">-{file.deletions}</span>
                        </div>
                      </div>
                    ))}
                    {fileChanges.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No changes to commit
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commits Tab */}
        <TabsContent value="commits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commit History</CardTitle>
              <CardDescription>Recent commits on current branch</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {commits.map((commit) => (
                    <div key={commit.hash} className="p-3 border rounded-lg hover:bg-muted">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <GitCommit className="h-4 w-4 text-muted-foreground" />
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {commit.shortHash}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => navigator.clipboard.writeText(commit.hash)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="font-medium text-sm">{commit.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {commit.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {commit.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {commit.files} files
                            </span>
                            <span className="text-green-600">+{commit.insertions}</span>
                            <span className="text-destructive">-{commit.deletions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {commits.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No commits found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Branches</CardTitle>
                  <CardDescription>Manage git branches</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="New branch name..."
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateBranch}
                    disabled={!String(newBranchName).trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <div
                      key={branch.name}
                      className={`p-3 border rounded-lg ${
                        branch.current ? 'border-blue-500 bg-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          <span className="font-medium">{branch.name}</span>
                          {branch.current && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          )}
                          {branch.remote && (
                            <Badge variant="outline" className="text-xs">Remote</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!branch.current && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSwitchBranch(branch.name)}
                              >
                                Checkout
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBranch(branch.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Last commit: {branch.lastCommit}
                      </div>
                    </div>
                  ))}
                  {branches.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No branches found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminal Tab */}
        <TabsContent value="terminal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Git Terminal Output</CardTitle>
              <CardDescription>Recent git command outputs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] bg-background text-muted-foreground p-4 rounded-lg">
                <pre className="text-xs font-mono">
                  {terminalOutput.length === 0 ? (
                    <span className="text-muted-foreground">No commands executed yet...</span>
                  ) : (
                    terminalOutput.join('\n')
                  )}
                </pre>
              </ScrollArea>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTerminalOutput([])}
                >
                  Clear Terminal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
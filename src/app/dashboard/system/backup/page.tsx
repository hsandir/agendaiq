"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Save, 
  GitBranch, 
  Download, 
  Upload,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle,
  GitCommit,
  Cloud,
  HardDrive,
  RefreshCw,
  ArrowLeft,
  Settings
} from "lucide-react";
import Link from "next/link";

interface BackupInfo {
  timestamp: string;
  branch: string;
  originalBranch?: string;
  message: string;
  type: 'manual' | 'auto' | 'github' | 'github-failed' | 'restore';
  changes?: number;
  files?: number;
  pushed?: boolean;
  trigger?: string;
  error?: string;
}

interface BackupStatus {
  currentBranch: string;
  hasUncommittedChanges: boolean;
  uncommittedFiles: number;
  lastCommit: string;
  githubStatus: 'connected' | 'disconnected' | 'unknown';
  backupCount: number;
  diskUsage: string
}

export default function BackupManagementPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/system/backup?action=list');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups ?? []);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch backups:', error);
      showNotification('Failed to fetch backup list');
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/system/backup?action=status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch backup status:', error);
      showNotification('Failed to fetch backup status');
    }
  };

  const createManualBackup = async () => {
    if (!String(backupMessage).trim()) {
      showNotification('Please enter a backup message');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'create', 
          message: backupMessage 
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification('Manual backup created successfully');
        setBackupMessage('');
        await fetchBackups();
        await fetchStatus();
      } else {
        const error = await response.json();
        showNotification(`Backup failed: ${error.error}`);
      }
    } catch (error: unknown) {
      console.error('Manual backup failed:', error);
      showNotification('Failed to create manual backup');
    } finally {
      setProcessing(false);
    }
  };

  const pushToGitHub = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'github-push', 
          message: 'Manual GitHub backup' 
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification('Successfully pushed to GitHub');
        await fetchBackups();
        await fetchStatus();
      } else {
        const error = await response.json();
        showNotification(`GitHub push failed: ${error.error}`);
      }
    } catch (error: unknown) {
      console.error('GitHub push failed:', error);
      showNotification('Failed to push to GitHub');
    } finally {
      setProcessing(false);
    }
  };

  const restoreBackup = async (branchName: string) => {
    if (!confirm(`Are you sure you want to restore from backup: ${branchName}?\n\nThis will merge the backup into your current branch.`)) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'restore', 
          restore: branchName 
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification('Backup restored successfully');
        await fetchBackups();
        await fetchStatus();
      } else {
        const error = await response.json();
        showNotification(`Restore failed: ${error.error}`);
      }
    } catch (error: unknown) {
      console.error('Restore failed:', error);
      showNotification('Failed to restore backup');
    } finally {
      setProcessing(false);
      setSelectedBackup(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBackups(), fetchStatus()]);
      setLoading(false);
    };

    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBackupTypeBadge = (type: string) => {
    switch (type) {
      case 'manual':
        return <Badge variant="outline" className="text-primary border-blue-600"><Save className="w-3 h-3 mr-1" />Manual</Badge>;
      case 'auto':
        return <Badge variant="outline" className="text-green-600 border-green-600"><Clock className="w-3 h-3 mr-1" />Auto</Badge>;
      case 'github':
        return <Badge variant="outline" className="text-secondary border-purple-600"><GitBranch className="w-3 h-3 mr-1" />GitHub</Badge>;
      case 'github-failed':
        return <Badge variant="destructive"><Cloud className="w-3 h-3 mr-1" />GitHub Failed</Badge>;
      case 'restore':
        return <Badge variant="outline" className="text-orange-600 border-orange-600"><RotateCcw className="w-3 h-3 mr-1" />Restore</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (githubStatus: string) => {
    switch (githubStatus) {
      case 'connected':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading backup information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Backup Management</h1>
          <p className="text-muted-foreground">Manage project backups and GitHub synchronization</p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <Button onClick={() => Promise.all([fetchBackups(), fetchStatus()])} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
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

      {/* Backup Status Overview */}
      {status && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Branch</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.currentBranch}</div>
              <p className="text-xs text-muted-foreground">
                {status.hasUncommittedChanges ? 
                  `${status.uncommittedFiles} uncommitted files` : 
                  'Working tree clean'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GitHub Status</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getStatusBadge(status.githubStatus)}
                <p className="text-xs text-muted-foreground">Remote repository connection</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.backupCount}</div>
              <p className="text-xs text-muted-foreground">Available restore points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.diskUsage}</div>
              <p className="text-xs text-muted-foreground">Project directory size</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backup Actions */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Save className="w-5 h-5 mr-2" />
              Create Manual Backup
            </CardTitle>
            <CardDescription>
              Create a snapshot of the current project state with a custom message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter backup message (e.g., 'Before major update')"
              value={backupMessage}
              onChange={(e) => setBackupMessage(e.target.value)}
            />
            <Button 
              onClick={createManualBackup}
              disabled={processing || !String(backupMessage).trim()}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Push to GitHub
            </CardTitle>
            <CardDescription>
              Upload current changes to GitHub repository for remote backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Status: {getStatusBadge(status?.githubStatus ?? 'unknown')}
              </div>
              {status?.hasUncommittedChanges && (
                <p className="text-sm text-orange-600">
                  {status.uncommittedFiles} uncommitted changes will be included
                </p>
              )}
            </div>
            <Button 
              onClick={pushToGitHub}
              disabled={processing}
              className="w-full"
              variant={status?.githubStatus === 'connected' ? 'default' : 'secondary'}
            >
              <Upload className="w-4 h-4 mr-2" />
              Push to GitHub
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Backup History
          </CardTitle>
          <CardDescription>
            View and manage all available backups. Click on a backup to see restore options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No backups found</p>
              <p className="text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedBackup === backup.branch 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedBackup(
                    selectedBackup === backup.branch ? null : backup.branch
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <GitCommit className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{backup.message}</span>
                        {getBackupTypeBadge(backup.type)}
                      </div>
                      <div className="text-sm text-muted-foreground space-x-4">
                        <span>Branch: {backup.branch}</span>
                        <span>Date: {new Date(backup.timestamp).toLocaleDateString()}</span>
                        <span>Time: {new Date(backup.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {backup.changes && (
                        <div className="text-xs text-muted-foreground">
                          {backup.changes} changes • {backup.files ?? 0} files
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {backup.pushed === true && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Cloud className="w-3 h-3 mr-1" />
                          GitHub
                        </Badge>
                      )}
                      {backup.pushed === false && (
                        <Badge variant="secondary">
                          <HardDrive className="w-3 h-3 mr-1" />
                          Local
                        </Badge>
                      )}
                    </div>
                  </div>

                  {selectedBackup === backup.branch && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="text-sm space-y-1">
                          <div><strong>Branch:</strong> {backup.branch}</div>
                          {backup.originalBranch && (
                            <div><strong>Original Branch:</strong> {backup.originalBranch}</div>
                          )}
                          {backup.trigger && (
                            <div><strong>Trigger:</strong> {backup.trigger}</div>
                          )}
                          {backup.error && (
                            <div className="text-destructive"><strong>Error:</strong> {backup.error}</div>
                          )}
                        </div>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreBackup(backup.branch);
                          }}
                          disabled={processing}
                          size="sm"
                          variant="outline"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      </div>
                    </div>
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
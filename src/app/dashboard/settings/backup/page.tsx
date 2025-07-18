"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  HardDrive, 
  Download, 
  Upload, 
  Clock, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Archive,
  Database
} from "lucide-react";

interface BackupEntry {
  id: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'running' | 'failed';
  size: string;
  timestamp: string;
  filename: string;
  duration?: string;
}

interface BackupData {
  backups: BackupEntry[];
  totalSize: string;
  lastBackup: string;
  nextScheduled: string;
  status: 'healthy' | 'warning' | 'error';
}

export default function BackupPage() {
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call real API endpoint for backup data
      const response = await fetch('/api/system/backup?action=list');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch backup data');
      }
      
      const data = await response.json();
      setBackupData(data);
      showNotification(`Loaded ${data.backups.length} backup entries`);
    } catch (error) {
      console.error('Failed to fetch backup data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch backup data';
      setError(errorMessage);
      showNotification(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'manual' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create backup');
      }
      
      showNotification('Backup created successfully!');
      await fetchBackupData(); // Refresh the list
    } catch (error) {
      console.error('Failed to create backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create backup';
      showNotification(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchBackupData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBackupData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'automatic':
        return <Badge variant="outline">Auto</Badge>;
      case 'manual':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Manual</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <HardDrive className="w-8 h-8 mr-3 text-green-600" />
              Backup & Restore
            </h1>
            <p className="text-muted-foreground">Loading backup data...</p>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading backup information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <HardDrive className="w-8 h-8 mr-3 text-green-600" />
              Backup & Restore
            </h1>
            <p className="text-muted-foreground">Manage system backups and restore points</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={fetchBackupData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>

        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Failed to load backup data:</strong> {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <HardDrive className="w-8 h-8 mr-3 text-green-600" />
            Backup & Restore
          </h1>
          <p className="text-muted-foreground">Real-time backup management and system restore points</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={createBackup}
            size="sm"
            disabled={creating}
          >
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Create Backup
              </>
            )}
          </Button>
          <Button 
            onClick={fetchBackupData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Fixed position notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <Alert key={index} className="bg-background border shadow-lg">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        ))}
      </div>

      {backupData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backupData.backups.length}</div>
                <p className="text-xs text-muted-foreground">
                  Available restore points
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backupData.totalSize}</div>
                <p className="text-xs text-muted-foreground">
                  Storage used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupData.lastBackup ? new Date(backupData.lastBackup).toLocaleDateString() : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Most recent backup
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Scheduled</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupData.nextScheduled ? new Date(backupData.nextScheduled).toLocaleDateString() : 'Not set'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatic backup
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Backup List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Archive className="h-5 w-5 mr-2 text-green-600" />
                Backup History
              </CardTitle>
              <CardDescription>List of all system backups and restore points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupData.backups.map((backup) => (
                  <div key={backup.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <HardDrive className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{backup.filename}</h4>
                            {getTypeBadge(backup.type)}
                            {getStatusBadge(backup.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Size: {backup.size}</span>
                            <span>Created: {new Date(backup.timestamp).toLocaleString()}</span>
                            {backup.duration && <span>Duration: {backup.duration}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {backupData.backups.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No backups found. Create your first backup to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
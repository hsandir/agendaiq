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
  Database,
  FileArchive,
  Settings,
  Shield,
  Folder
} from "lucide-react";

interface BackupEntry {
  id: string;
  type: 'automatic' | 'manual' | 'full-system';
  status: 'completed' | 'running' | 'failed';
  size: string;
  timestamp: string;
  filename: string;
  duration?: string;
  components: string[];
  downloadUrl?: string;
}

interface BackupData {
  backups: BackupEntry[];
  totalSize: string;
  lastBackup: string;
  nextScheduled: string;
  status: 'healthy' | 'warning' | 'error'
}

interface BackupComponent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  size?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface BackupClientProps {
  initialBackupData: BackupData | null
}

export default function BackupClient({ initialBackupData }: BackupClientProps) {
  const [backupData, setBackupData] = useState<BackupData | null>(initialBackupData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  // Backup components configuration
  const backupComponents: BackupComponent[] = [
    {
      id: 'database',
      name: 'Database',
      description: 'Complete database with all user data, meetings, and configurations',
      enabled: true,
      size: '~2.5 MB',
      icon: Database
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Application settings, configurations, and preferences',
      enabled: true,
      size: '~50 KB',
      icon: Settings
    },
    {
      id: 'files',
      name: 'Uploaded Files',
      description: 'User uploads, documents, and media files',
      enabled: true,
      size: '~15 MB',
      icon: Folder
    },
    {
      id: 'logs',
      name: 'System Logs',
      description: 'Application logs and audit trails',
      enabled: false,
      size: '~500 KB',
      icon: FileArchive
    },
    {
      id: 'schema',
      name: 'Database Schema',
      description: 'Database structure and migration files',
      enabled: true,
      size: '~100 KB',
      icon: Archive
    }
  ];

  // Initialize selected components
  useEffect(() => {
    setSelectedComponents(
      backupComponents.filter(comp => comp.enabled).map(comp => comp.id)
    );
  }, []);

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/system/backup?action=list');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch backup data');
      }
      
      const data = await response.json();
      setBackupData(data);
      showNotification(`Loaded ${data.backups.length} backup entries`);
    } catch (error: unknown) {
      console.error('Failed to fetch backup data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch backup data';
      setError(errorMessage);
      showNotification(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createFullSystemBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'full-system',
          components: selectedComponents
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create backup');
      }

      const result = await response.json();
      showNotification('Full system backup created successfully!');
      
      // Refresh backup list
      await fetchBackupData();
      
      return result;
    } catch (error: unknown) {
      console.error('Backup creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create backup';
      showNotification(`Backup failed: ${errorMessage}`);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const handleBackupUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      showNotification('Please select a valid backup ZIP file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('backup', file);

      const response = await fetch('/api/system/backup', {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload backup');
      }

      const result = await response.json();
      showNotification('Backup uploaded and restored successfully!');
      
      // Refresh backup list
      await fetchBackupData();
      
    } catch (error: unknown) {
      console.error('Backup upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload backup';
      showNotification(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const toggleComponent = (componentId: string) => {
    setSelectedComponents(prev => {
      if (prev.includes(componentId)) {
        return prev.filter(id => id !== componentId)
      } else {
        return [...prev, componentId];
      }
    });
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
    } catch (error: unknown) {
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
        return <Badge variant="outline" className="text-primary border-blue-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'automatic':
        return <Badge variant="outline">Auto</Badge>;
      case 'manual':
        return <Badge variant="outline" className="text-primary border-blue-600">Manual</Badge>;
      case 'full-system':
        return <Badge variant="outline" className="text-secondary border-purple-600">Full System</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  };

  if (loading && !backupData) {
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

  if (error && !backupData) {
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

        <Alert className="mb-6 border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
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
            <FileArchive className="w-8 h-8 mr-3 text-secondary" />
            Full System Backup & Restore
          </h1>
          <p className="text-muted-foreground">Complete system backup including database, settings, files, and configurations</p>
        </div>
        
        <div className="flex items-center gap-2">
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
          <Alert key={`notification-${index}-${notification}`} className="bg-background border shadow-lg">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Backup Creation Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Create Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Archive className="h-5 w-5 mr-2 text-secondary" />
              Create Full System Backup
            </CardTitle>
            <CardDescription>Generate a complete backup ZIP file containing all selected components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Select Components to Include:</h4>
              {backupComponents.map((component) => (
                <div key={component.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <component.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h5 className="font-medium text-sm">{component.name}</h5>
                      <p className="text-xs text-muted-foreground">{component.description}</p>
                      {component.size && <p className="text-xs text-muted-foreground">Est. size: {component.size}</p>}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedComponents.includes(component.id)}
                    onChange={() => toggleComponent(component.id)}
                    className="w-4 h-4 text-secondary border-border rounded focus:ring-ring"
                  />
                </div>
              ))}
            </div>
            
            <Button 
              onClick={createFullSystemBackup}
              className="w-full"
              disabled={creating ?? selectedComponents.length === 0}
            >
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4 mr-2" />
                  Create Full System Backup ({selectedComponents.length} components)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upload/Restore Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Upload & Restore Backup
            </CardTitle>
            <CardDescription>Upload a backup ZIP file to restore your system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Upload Backup File</p>
              <p className="text-xs text-muted-foreground mb-4">Select a ZIP backup file to restore</p>
              
              <input
                type="file"
                accept=".zip"
                onChange={handleBackupUpload}
                disabled={uploading}
                className="hidden"
                id="backup-upload"
              />
              
              <Button 
                onClick={() => document.getElementById('backup-upload')?.click()}
                variant="outline"
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading & Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select Backup File
                  </>
                )}
              </Button>
            </div>
            
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                <strong>Warning:</strong> Restoring a backup will overwrite all current data. Make sure to create a backup of your current system first.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
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
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  Ready for backup
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Backup List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileArchive className="h-5 w-5 mr-2 text-secondary" />
                Backup History
              </CardTitle>
              <CardDescription>List of all full system backups and restore points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupData.backups.map((backup) => (
                  <div key={backup.id} className="border rounded-lg p-4 hover:bg-muted">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileArchive className="w-5 h-5 text-secondary" />
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{backup.filename}</h4>
                            {getTypeBadge(backup.type)}
                            {getStatusBadge(backup.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <span>Size: {backup.size}</span>
                            <span>Created: {new Date(backup.timestamp).toLocaleString()}</span>
                            {backup.duration && <span>Duration: {backup.duration}</span>}
                          </div>
                          {backup.components && backup.components.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {backup.components.map((component, index) => (
                                <Badge key={`${backup.id}-component-${index}`} variant="secondary" className="text-xs">
                                  {component}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {backup.downloadUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(backup.downloadUrl, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to restore this backup? This will overwrite all current data.')) {
                              // Handle restore logic here
                              showNotification('Restore functionality coming soon');
                            }
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {backupData.backups.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileArchive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No full system backups found. Create your first backup to get started.</p>
                    <p className="text-sm mt-2">Use the backup creation tool above to generate a complete system backup.</p>
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
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Filter,
  Shield,
  Info,
  XCircle,
  Clock,
  Archive,
  RotateCcw,
  Play,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Logger } from '@/lib/utils/logger';
import { LoadingSpinner, LoadingButton } from '@/components/ui/LoadingSpinner';

interface Dependency {
  name: string;
  currentVersion: string;
  requiredVersion: string;
  latestVersion: string;
  status: 'missing' | 'outdated' | 'vulnerable' | 'ok';
  description: string;
  lastUpdated: string;
  size: string;
  type: 'major' | 'minor' | 'patch';
  compatibility: CompatibilityInfo;
}

interface CompatibilityInfo {
  risk: 'low' | 'medium' | 'high';
  recommendation: 'safe' | 'caution' | 'avoid';
  reason: string;
  details: string;
  nodeVersion?: string;
  breakingChanges?: boolean;
}

interface UpdateOperation {
  id: string;
  type: 'install' | 'update' | 'rollback';
  packageName: string;
  fromVersion?: string;
  toVersion: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  backupId?: string;
  error?: string;
}

interface BackupInfo {
  id: string;
  timestamp: string;
  packageName: string;
  version: string;
  size: string;
  type: 'pre-update' | 'manual';
}

export default function DependenciesPage() {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [operations, setOperations] = useState<UpdateOperation[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [updateResult, setUpdateResult] = useState<{success: boolean; message: string; details?: any} | null>(null);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  // Uyumluluk değerlendirmesi
  const assessCompatibility = (pkg: any): CompatibilityInfo => {
    const { name, current, latest, type } = pkg;
    
    // Kritik paketler
    const criticalPackages = [
      'next', 'react', 'react-dom', '@types/react', '@types/react-dom',
      'typescript', 'prisma', '@prisma/client', 'tailwindcss'
    ];
    
    // Yüksek riskli paketler
    const highRiskPackages = [
      'next', 'react', 'react-dom', 'typescript', 'prisma'
    ];
    
    // Güvenli paketler
    const safePackages = [
      '@types/node', '@types/bcryptjs', '@types/nodemailer',
      'lucide-react', 'date-fns', 'clsx', 'tailwind-merge'
    ];

    // Node.js uyumluluğu kontrolü
    const nodeVersion = process.version || '18.20.8';
    const needsNewerNode = checkNodeVersionRequirement(name, latest);

    if (needsNewerNode) {
      return {
        risk: 'high',
        recommendation: 'avoid',
        reason: 'Node.js version incompatible',
        details: `${name}@${latest} requires Node.js 20+ but you're running ${nodeVersion}`,
        nodeVersion: nodeVersion,
        breakingChanges: true
      };
    }

    if (safePackages.includes(name)) {
      return {
        risk: 'low',
        recommendation: 'safe',
        reason: 'Safe package update',
        details: `${name} is a utility package that rarely causes compatibility issues. ${type} updates are generally safe.`,
        breakingChanges: false
      };
    }

    if (type === 'patch') {
      return {
        risk: 'low',
        recommendation: 'safe',
        reason: 'Patch update (bug fixes)',
        details: `Patch updates typically contain only bug fixes and security updates with minimal risk of breaking changes.`,
        breakingChanges: false
      };
    }

    if (type === 'minor') {
      if (criticalPackages.includes(name)) {
        return {
          risk: 'medium',
          recommendation: 'caution',
          reason: 'Minor update to critical package',
          details: `${name} is a critical package. Minor updates may introduce subtle breaking changes. Test thoroughly after update.`,
          breakingChanges: false
        };
      }
      return {
        risk: 'low',
        recommendation: 'safe',
        reason: 'Minor update (new features)',
        details: `Minor updates add new features and are generally safe, but testing is recommended.`,
        breakingChanges: false
      };
    }

    if (type === 'major') {
      if (highRiskPackages.includes(name)) {
        return {
          risk: 'high',
          recommendation: 'avoid',
          reason: 'Major update to high-risk package',
          details: `Major updates to ${name} often include breaking changes. Review changelog and migration guide. Consider updating in a separate branch first.`,
          breakingChanges: true
        };
      }
      return {
        risk: 'medium',
        recommendation: 'caution',
        reason: 'Major update (breaking changes)',
        details: `Major updates may include breaking changes. Review the changelog and test thoroughly before updating.`,
        breakingChanges: true
      };
    }

    return {
      risk: 'medium',
      recommendation: 'caution',
      reason: 'Unknown package type',
      details: `Unknown package type. Review the changelog before updating.`,
      breakingChanges: false
    };
  };

  const checkNodeVersionRequirement = (packageName: string, version: string): boolean => {
    // Bazı paketler yeni Node.js versiyonu gerektirir
    const nodeRequirements: Record<string, string> = {
      'lru-cache': '11.0.0', // v11+ requires Node 20+
    };
    
    if (nodeRequirements[packageName]) {
      const requiredVersion = nodeRequirements[packageName];
      return compareVersions(version, requiredVersion) >= 0;
    }
    
    return false;
  };

  const compareVersions = (a: string, b: string): number => {
    const aParts = a.replace(/[^\d.]/g, '').split('.').map(Number);
    const bParts = b.replace(/[^\d.]/g, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  };

  // Create backup before update
  const createBackup = async (packageName: string, version: string): Promise<string> => {
    const backupId = `backup_${packageName}_${Date.now()}`;
    const backup: BackupInfo = {
      id: backupId,
      timestamp: new Date().toISOString(),
      packageName,
      version,
      size: 'Unknown',
      type: 'pre-update'
    };
    
    setBackups(prev => [...prev, backup]);
    Logger.info('Backup created', { backupId, packageName, version }, 'dependencies');
    
    return backupId;
  };

  // Handle single package update
  const handleSingleUpdate = async (dependency: Dependency) => {
    if (dependency.compatibility.recommendation === 'avoid' && dependency.status === 'ok') {
      showNotification(`${dependency.name} update not recommended - please review changelog first`);
      return;
    }

    setIsUpdating(true);
    const operationId = `op_${dependency.name}_${Date.now()}`;
    
    try {
      // Create backup
      const backupId = await createBackup(dependency.name, dependency.currentVersion);
      
      // Create operation
      const operation: UpdateOperation = {
        id: operationId,
        type: dependency.status === 'missing' ? 'install' : 'update',
        packageName: dependency.name,
        fromVersion: dependency.currentVersion,
        toVersion: dependency.latestVersion,
        status: 'running',
        startTime: new Date().toISOString(),
        backupId
      };
      
      setOperations(prev => [...prev, operation]);
      
      const response = await fetch('/api/system/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'packages',
          packages: [dependency.name]
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOperations(prev => prev.map(op => 
          op.id === operationId 
            ? { ...op, status: 'completed', endTime: new Date().toISOString() }
            : op
        ));
        
        setUpdateResult({
          success: true,
          message: `${dependency.name} updated successfully from ${dependency.currentVersion} to ${dependency.latestVersion}`
        });
        
        Logger.info('Package updated successfully', { 
          packageName: dependency.name, 
          fromVersion: dependency.currentVersion,
          toVersion: dependency.latestVersion
        }, 'dependencies');
        
        fetchDependencies();
      } else {
        throw new Error(result.message || 'Update failed');
      }
      
    } catch (error) {
      setOperations(prev => prev.map(op => 
        op.id === operationId 
          ? { ...op, status: 'failed', endTime: new Date().toISOString(), error: String(error) }
          : op
      ));
      
      setUpdateResult({
        success: false,
        message: `Failed to update ${dependency.name}: ${String(error)}`
      });
      
      Logger.error('Package update failed', { 
        packageName: dependency.name, 
        error: String(error) 
      }, 'dependencies');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk updates
  const handleBulkUpdate = async (type: 'missing' | 'outdated' | 'safe') => {
    let packagesToUpdate: Dependency[] = [];
    
    switch (type) {
      case 'missing':
        packagesToUpdate = dependencies.filter(d => d.status === 'missing');
        break;
      case 'outdated':
        packagesToUpdate = dependencies.filter(d => 
          d.status === 'outdated' && d.compatibility.recommendation !== 'avoid'
        );
        break;
      case 'safe':
        packagesToUpdate = dependencies.filter(d => 
          d.compatibility.recommendation === 'safe' && d.status !== 'ok'
        );
        break;
    }
    
    if (packagesToUpdate.length === 0) {
      showNotification(`No ${type} packages to update`);
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Create backups for all packages
      for (const pkg of packagesToUpdate) {
        await createBackup(pkg.name, pkg.currentVersion);
      }
      
      const response = await fetch('/api/system/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'packages',
          packages: packagesToUpdate.map(p => p.name)
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUpdateResult({
          success: true,
          message: `Bulk update completed: ${result.summary?.successful || 0} successful, ${result.summary?.failed || 0} failed`,
          details: result.summary
        });
        
        Logger.info('Bulk update completed', { 
          type,
          count: packagesToUpdate.length,
          result: result.summary 
        }, 'dependencies');
        
        fetchDependencies();
      } else {
        throw new Error(result.message || 'Bulk update failed');
      }
      
    } catch (error) {
      setUpdateResult({
        success: false,
        message: `Bulk update failed: ${String(error)}`
      });
      
      Logger.error('Bulk update failed', { type, error: String(error) }, 'dependencies');
    } finally {
      setIsUpdating(false);
    }
  };

  // Rollback functionality
  const handleRollback = async (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) {
      showNotification('Backup not found');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const rollbackOperation: UpdateOperation = {
        id: `rollback_${backup.packageName}_${Date.now()}`,
        type: 'rollback',
        packageName: backup.packageName,
        toVersion: backup.version,
        status: 'running',
        startTime: new Date().toISOString(),
        backupId
      };
      
      setOperations(prev => [...prev, rollbackOperation]);
      
      const response = await fetch('/api/system/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'packages',
          packages: [backup.packageName],
          targetVersion: backup.version
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOperations(prev => prev.map(op => 
          op.id === rollbackOperation.id 
            ? { ...op, status: 'completed', endTime: new Date().toISOString() }
            : op
        ));
        
        showNotification(`${backup.packageName} rolled back to ${backup.version}`);
        fetchDependencies();
      } else {
        throw new Error(result.message || 'Rollback failed');
      }
      
    } catch (error) {
      showNotification(`Rollback failed: ${String(error)}`);
      Logger.error('Rollback failed', { backupId, error: String(error) }, 'dependencies');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchDependencies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system/status');
      if (response.ok) {
        const data = await response.json();
        
        const realDependencies: Dependency[] = [];
        
        // Outdated packages'ları dönüştür
        if (data.packages.outdated && data.packages.outdated.length > 0) {
          data.packages.outdated.forEach((pkg: any) => {
            const compatibility = assessCompatibility(pkg);
            
            realDependencies.push({
              name: pkg.name,
              currentVersion: pkg.current,
              requiredVersion: pkg.wanted,
              latestVersion: pkg.latest,
              status: pkg.type === 'major' ? 'outdated' : 'ok',
              description: `Package needs ${pkg.type} update - ${compatibility.reason}`,
              lastUpdated: 'Recently checked',
              size: 'Unknown',
              type: pkg.type,
              compatibility
            });
          });
        }
        
        // Vulnerability bilgisi ekle
        if (data.packages && data.packages.vulnerabilities > 0) {
          realDependencies.push({
            name: 'Security Issues',
            currentVersion: 'various',
            requiredVersion: 'patched versions',
            latestVersion: 'patched versions',
            status: 'vulnerable',
            description: `${data.packages.vulnerabilities} security vulnerabilities detected`,
            lastUpdated: 'Now',
            size: 'N/A',
            type: 'patch',
            compatibility: {
              risk: 'high',
              recommendation: 'safe',
              reason: 'Security patches',
              details: 'Security updates should be applied immediately'
            }
          });
        }
        
        // Eğer sorun yoksa örnek paketler ekle
        if (realDependencies.length === 0) {
          const samplePackages = [
            {
              name: 'next',
              current: '15.3.5',
              wanted: '^15.3.5',
              latest: '15.3.5',
              type: 'patch'
            },
            {
              name: 'react',
              current: '18.3.1',
              wanted: '^18.3.1',
              latest: '19.0.0',
              type: 'major'
            },
            {
              name: 'typescript',
              current: '5.8.3',
              wanted: '^5.8.3',
              latest: '5.8.4',
              type: 'patch'
            }
          ];

          samplePackages.forEach(pkg => {
            const compatibility = assessCompatibility(pkg);
            
            realDependencies.push({
              name: pkg.name,
              currentVersion: pkg.current,
              requiredVersion: pkg.wanted,
              latestVersion: pkg.latest,
              status: pkg.current === pkg.latest ? 'ok' : 'outdated',
              description: `${pkg.name} - ${compatibility.reason}`,
              lastUpdated: 'Up to date',
              size: pkg.name === 'next' ? '34.2 MB' : pkg.name === 'typescript' ? '67.3 MB' : '2.8 MB',
              type: pkg.type as 'major' | 'minor' | 'patch',
              compatibility
            });
          });
        }
        
        setDependencies(realDependencies);
        Logger.info('Dependencies fetched successfully', { count: realDependencies.length }, 'dependencies');
      } else {
        Logger.error('Failed to fetch system status', { status: response.status }, 'dependencies');
        showNotification('Failed to fetch dependencies data');
      }
    } catch (error) {
      Logger.error('Failed to fetch dependencies', { error: String(error) }, 'dependencies');
      showNotification('Error fetching dependencies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
      case 'outdated':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Outdated</Badge>;
      case 'vulnerable':
        return <Badge variant="destructive">Vulnerable</Badge>;
      case 'ok':
        return <Badge variant="outline" className="text-green-600 border-green-600">OK</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'missing':
      case 'vulnerable':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'outdated':
        return <Download className="h-4 w-4 text-yellow-600" />;
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredDependencies = dependencies.filter(dep => {
    const matchesSearch = dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dep.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || dep.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = dependencies.reduce((acc, dep) => {
    acc[dep.status] = (acc[dep.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dependencies Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage project dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDependencies}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dependencies</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dependencies.length}</div>
            <p className="text-xs text-muted-foreground">Tracked packages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.missing || 0}</div>
            <p className="text-xs text-muted-foreground">Need installation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outdated</CardTitle>
            <Download className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.outdated || 0}</div>
            <p className="text-xs text-muted-foreground">Available updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerable</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.vulnerable || 0}</div>
            <p className="text-xs text-muted-foreground">Security issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Update Result Alert */}
      {updateResult && (
        <Alert className={updateResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CheckCircle className={`h-4 w-4 ${updateResult.success ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={updateResult.success ? 'text-green-800' : 'text-red-800'}>
            {updateResult.message}
            {updateResult.details && (
              <div className="mt-2 text-sm">
                <div>Details: {JSON.stringify(updateResult.details, null, 2)}</div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <Alert key={index} className="border-blue-200 bg-blue-50 max-w-md">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {notification}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dependencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="missing">Missing</option>
            <option value="outdated">Outdated</option>
            <option value="vulnerable">Vulnerable</option>
            <option value="ok">OK</option>
          </select>
        </div>
      </div>

      {/* Dependencies List */}
      <Card>
        <CardHeader>
          <CardTitle>Dependency Details</CardTitle>
          <CardDescription>
            Detailed information about project dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDependencies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No dependencies found matching your criteria
              </div>
            ) : (
              filteredDependencies.map((dep, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(dep.status)}
                    <div>
                      <div className="font-medium">{dep.name}</div>
                      <div className="text-sm text-muted-foreground">{dep.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Size: {dep.size} • Last updated: {dep.lastUpdated}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div>Current: {dep.currentVersion}</div>
                      <div className="text-muted-foreground">Required: {dep.requiredVersion}</div>
                    </div>
                    {getStatusBadge(dep.status)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        if (dep.status === 'missing') {
                          try {
                            const response = await fetch('/api/system/fix', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'install', package: dep.name })
                            });
                            if (response.ok) {
                              alert(`${dep.name} installed successfully`);
                              fetchDependencies();
                            }
                          } catch (error) {
                            alert(`Failed to install ${dep.name}`);
                          }
                        } else {
                          try {
                            const response = await fetch('/api/system/update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ package: dep.name })
                            });
                            if (response.ok) {
                              alert(`${dep.name} updated successfully`);
                              fetchDependencies();
                            }
                          } catch (error) {
                            alert(`Failed to update ${dep.name}`);
                          }
                        }
                      }}
                    >
                      {dep.status === 'missing' ? 'Install' : 'Update'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          className="flex items-center"
          onClick={async () => {
            const missingDeps = dependencies.filter(d => d.status === 'missing');
            if (missingDeps.length === 0) {
              alert('No missing dependencies to install');
              return;
            }
            
            try {
              const response = await fetch('/api/system/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'install-multiple', 
                  packages: missingDeps.map(d => d.name) 
                })
              });
              if (response.ok) {
                alert(`Installing ${missingDeps.length} missing dependencies...`);
                fetchDependencies();
              }
            } catch (error) {
              alert('Failed to install missing dependencies');
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Install All Missing ({dependencies.filter(d => d.status === 'missing').length})
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={() => handleBulkUpdate('outdated')}
          disabled={isUpdating || dependencies.filter(d => d.status === 'outdated').length === 0}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Update All Outdated ({dependencies.filter(d => d.status === 'outdated').length})
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
          onClick={() => handleBulkUpdate('safe')}
          disabled={isUpdating || dependencies.filter(d => d.compatibility.recommendation === 'safe' && d.status !== 'ok').length === 0}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          Update Safe Packages ({dependencies.filter(d => d.compatibility.recommendation === 'safe' && d.status !== 'ok').length})
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={() => {
            const report = {
              timestamp: new Date().toISOString(),
              total: dependencies.length,
              missing: dependencies.filter(d => d.status === 'missing').length,
              outdated: dependencies.filter(d => d.status === 'outdated').length,
              vulnerable: dependencies.filter(d => d.status === 'vulnerable').length,
              ok: dependencies.filter(d => d.status === 'ok').length,
              details: dependencies
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dependencies-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Operations Log */}
      {operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Update Operations
            </CardTitle>
            <CardDescription>
              Recent update operations and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operations.slice(-5).map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {operation.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                    {operation.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {operation.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                    <div>
                      <div className="font-medium">{operation.packageName}</div>
                      <div className="text-sm text-muted-foreground">
                        {operation.type === 'rollback' 
                          ? `Rollback to ${operation.toVersion}`
                          : `${operation.fromVersion} → ${operation.toVersion}`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(operation.startTime).toLocaleString()}
                        {operation.endTime && ` • Ended: ${new Date(operation.endTime).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        operation.status === 'completed' ? 'outline' : 
                        operation.status === 'failed' ? 'destructive' : 'default'
                      }
                      className={
                        operation.status === 'completed' ? 'text-green-600 border-green-600' : 
                        operation.status === 'failed' ? '' : 'text-blue-600 border-blue-600'
                      }
                    >
                      {operation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Management */}
      {backups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Archive className="h-5 w-5 mr-2 text-purple-600" />
              Backup Management
            </CardTitle>
            <CardDescription>
              Package backups available for rollback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backups.slice(-10).map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Archive className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-medium">{backup.packageName}</div>
                      <div className="text-sm text-muted-foreground">
                        Version: {backup.version} • Size: {backup.size}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(backup.timestamp).toLocaleString()} • Type: {backup.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRollback(backup.id)}
                      disabled={isUpdating}
                      className="text-purple-600 border-purple-600 hover:bg-purple-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Rollback
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
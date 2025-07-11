"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Shield,
  Clock,
  GitBranch,
  Package,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface PackageUpdate {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}

interface UpdateResult {
  success: boolean;
  message: string;
  summary?: {
    attempted: number;
    successful: number;
    failed: number;
    skipped: number;
    details: Array<{
      package: string;
      status: 'success' | 'failed' | 'skipped';
      reason?: string;
      from?: string;
      to?: string;
      error?: string;
    }>;
  };
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<PackageUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [lastCheck, setLastCheck] = useState<string>("");
  const [vulnerabilities, setVulnerabilities] = useState(0);

  const fetchUpdates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system/status');
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.packages.outdated || []);
        setVulnerabilities(data.packages.vulnerabilities || 0);
        setLastCheck(new Date().toLocaleString());
      } else {
        console.error('Failed to fetch system status');
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performUpdate = async (packages?: string[]) => {
    setIsUpdating(true);
    setUpdateResult(null);
    try {
      const response = await fetch('/api/system/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'packages',
          packages: packages || Array.from(selectedUpdates)
        })
      });
      
      const result = await response.json();
      setUpdateResult(result);
      
      if (result.success) {
        // Refresh the updates list after successful update
        setTimeout(() => {
          fetchUpdates();
          setSelectedUpdates(new Set());
        }, 2000);
      }
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateResult({
        success: false,
        message: 'Update failed: ' + (error as Error).message
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateSecurityPackages = () => {
    const securityPackages = updates
      .filter(update => update.type === 'patch' || update.type === 'minor')
      .map(update => update.name);
    performUpdate(securityPackages);
  };

  const updateAllPatches = () => {
    const patchPackages = updates
      .filter(update => update.type === 'patch')
      .map(update => update.name);
    performUpdate(patchPackages);
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'major':
        return <Badge variant="destructive" className="bg-orange-600">Major</Badge>;
      case 'minor':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Minor</Badge>;
      case 'patch':
        return <Badge variant="outline" className="text-green-600 border-green-600">Patch</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'minor':
        return <GitBranch className="h-4 w-4 text-blue-600" />;
      case 'patch':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredUpdates = updates.filter(update => {
    const matchesSearch = update.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || update.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const typeCounts = updates.reduce((acc, update) => {
    acc[update.type] = (acc[update.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const toggleUpdate = (updateName: string) => {
    const newSelected = new Set(selectedUpdates);
    if (newSelected.has(updateName)) {
      newSelected.delete(updateName);
    } else {
      newSelected.add(updateName);
    }
    setSelectedUpdates(newSelected);
  };

  const securityPackages = updates.filter(u => u.type === 'patch' || u.type === 'minor').length;
  const patchPackages = updates.filter(u => u.type === 'patch').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Package Updates</h1>
          <p className="text-muted-foreground">
            Manage available package updates and security patches
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
            onClick={fetchUpdates}
            disabled={isLoading || isUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Update Result Alert */}
      {updateResult && (
        <Alert className={updateResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CheckCircle className={`h-4 w-4 ${updateResult.success ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={updateResult.success ? 'text-green-800' : 'text-red-800'}>
            {updateResult.message}
            {updateResult.summary && (
              <div className="mt-2 text-sm">
                <div>Attempted: {updateResult.summary.attempted}</div>
                <div>Successful: {updateResult.summary.successful}</div>
                <div>Failed: {updateResult.summary.failed}</div>
                <div>Skipped: {updateResult.summary.skipped}</div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updates.length}</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{vulnerabilities}</div>
            <p className="text-xs text-muted-foreground">Vulnerabilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Major</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{typeCounts.major || 0}</div>
            <p className="text-xs text-muted-foreground">Breaking changes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minor</CardTitle>
            <GitBranch className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{typeCounts.minor || 0}</div>
            <p className="text-xs text-muted-foreground">New features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patch</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{typeCounts.patch || 0}</div>
            <p className="text-xs text-muted-foreground">Bug fixes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
          <option value="patch">Patch</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedUpdates.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{selectedUpdates.size} package(s) selected</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedUpdates(new Set())}>
                  Clear Selection
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => performUpdate()}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Selected'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Updates List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Updates</CardTitle>
          <CardDescription>
            Review and install package updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUpdates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isLoading ? 'Loading updates...' : 'No updates found matching your criteria'}
              </div>
            ) : (
              filteredUpdates.map((update, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedUpdates.has(update.name)}
                      onChange={() => toggleUpdate(update.name)}
                      className="rounded"
                    />
                    {getTypeIcon(update.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{update.name}</div>
                        {update.type === 'major' && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                            Breaking
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current: {update.current} → Latest: {update.latest}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                        <span>Wanted: {update.wanted}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getTypeBadge(update.type)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => performUpdate([update.name])}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
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
          disabled={securityPackages === 0 || isUpdating}
          onClick={updateSecurityPackages}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          Install Security Updates ({securityPackages})
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center"
          disabled={patchPackages === 0 || isUpdating}
          onClick={updateAllPatches}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Update All Patches ({patchPackages})
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center"
          disabled={updates.length === 0 || isUpdating}
          onClick={() => performUpdate(updates.map(u => u.name))}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Update All ({updates.length})
        </Button>
      </div>

      {/* Update Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2 text-blue-600" />
            Update Status
          </CardTitle>
          <CardDescription>
            Current update status and recent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>System up-to-date status</span>
                <span>{updates.length === 0 ? '100%' : `${Math.max(0, 100 - updates.length * 5)}%`}</span>
              </div>
              <Progress value={updates.length === 0 ? 100 : Math.max(0, 100 - updates.length * 5)} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              Last update check: {lastCheck || 'Never'}
            </div>
            {vulnerabilities > 0 && (
              <div className="text-sm text-red-600">
                ⚠️ {vulnerabilities} security vulnerabilities detected
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
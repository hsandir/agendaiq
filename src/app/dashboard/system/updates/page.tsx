"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  Package
} from "lucide-react";
import Link from "next/link";

interface PackageUpdate {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: 'major' | 'minor' | 'patch' | 'security';
  description: string;
  releaseDate: string;
  size: string;
  breaking: boolean;
  securityFixes: number;
  dependencies: number;
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<PackageUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());

  const fetchUpdates = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockUpdates: PackageUpdate[] = [
        {
          name: 'next',
          currentVersion: '13.4.0',
          latestVersion: '14.0.3',
          type: 'major',
          description: 'The React Framework for the Web',
          releaseDate: '2 days ago',
          size: '24.5 MB',
          breaking: true,
          securityFixes: 2,
          dependencies: 45
        },
        {
          name: 'react',
          currentVersion: '18.2.0',
          latestVersion: '18.2.15',
          type: 'security',
          description: 'React library for building user interfaces',
          releaseDate: '1 week ago',
          size: '2.8 MB',
          breaking: false,
          securityFixes: 3,
          dependencies: 12
        },
        {
          name: '@types/react',
          currentVersion: '18.0.28',
          latestVersion: '18.2.5',
          type: 'minor',
          description: 'TypeScript definitions for React',
          releaseDate: '3 days ago',
          size: '456 KB',
          breaking: false,
          securityFixes: 0,
          dependencies: 3
        },
        {
          name: 'tailwindcss',
          currentVersion: '3.3.0',
          latestVersion: '3.3.6',
          type: 'patch',
          description: 'Utility-first CSS framework',
          releaseDate: '5 days ago',
          size: '8.2 MB',
          breaking: false,
          securityFixes: 0,
          dependencies: 18
        },
        {
          name: 'eslint',
          currentVersion: '8.40.0',
          latestVersion: '8.56.0',
          type: 'minor',
          description: 'JavaScript and TypeScript linter',
          releaseDate: '1 week ago',
          size: '12.1 MB',
          breaking: false,
          securityFixes: 1,
          dependencies: 34
        },
        {
          name: 'prisma',
          currentVersion: '4.15.0',
          latestVersion: '5.7.1',
          type: 'major',
          description: 'Database toolkit and ORM',
          releaseDate: '4 days ago',
          size: '67.3 MB',
          breaking: true,
          securityFixes: 4,
          dependencies: 28
        }
      ];
      
      setUpdates(mockUpdates);
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const getTypeBadge = (type: string, breaking: boolean, securityFixes: number) => {
    if (securityFixes > 0) {
      return <Badge variant="destructive" className="bg-red-600">Security</Badge>;
    }
    switch (type) {
      case 'major':
        return <Badge variant={breaking ? "destructive" : "outline"} className={breaking ? "bg-orange-600" : "text-orange-600 border-orange-600"}>Major</Badge>;
      case 'minor':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Minor</Badge>;
      case 'patch':
        return <Badge variant="outline" className="text-green-600 border-green-600">Patch</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string, securityFixes: number) => {
    if (securityFixes > 0) {
      return <Shield className="h-4 w-4 text-red-600" />;
    }
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
    const matchesSearch = update.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         update.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || 
                         (filterType === "security" && update.securityFixes > 0) ||
                         (filterType === "breaking" && update.breaking) ||
                         update.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const typeCounts = updates.reduce((acc, update) => {
    if (update.securityFixes > 0) {
      acc.security = (acc.security || 0) + 1;
    }
    if (update.breaking) {
      acc.breaking = (acc.breaking || 0) + 1;
    }
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
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

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
            <div className="text-2xl font-bold text-red-600">{typeCounts.security || 0}</div>
            <p className="text-xs text-muted-foreground">Critical fixes</p>
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
          <option value="security">Security</option>
          <option value="breaking">Breaking Changes</option>
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
                <Button size="sm">
                  Update Selected
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
                No updates found matching your criteria
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
                    {getTypeIcon(update.type, update.securityFixes)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{update.name}</div>
                        {update.breaking && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                            Breaking
                          </Badge>
                        )}
                        {update.securityFixes > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {update.securityFixes} security fix{update.securityFixes > 1 ? 'es' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{update.description}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                        <span>Size: {update.size}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {update.releaseDate}
                        </span>
                        <span>{update.dependencies} dependencies</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div>Current: {update.currentVersion}</div>
                      <div className="text-muted-foreground">Latest: {update.latestVersion}</div>
                    </div>
                    {getTypeBadge(update.type, update.breaking, update.securityFixes)}
                    <Button size="sm" variant="outline">
                      Update
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
        <Button className="flex items-center" disabled={updates.filter(u => u.securityFixes > 0).length === 0}>
          <Shield className="h-4 w-4 mr-2" />
          Install Security Updates ({typeCounts.security || 0})
        </Button>
        <Button variant="outline" className="flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Update All Patches
        </Button>
        <Button variant="outline" className="flex items-center">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Changelog
        </Button>
      </div>

      {/* Update Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2 text-blue-600" />
            Update Progress
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
                <span>73%</span>
              </div>
              <Progress value={73} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              Last update check: 2 minutes ago
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
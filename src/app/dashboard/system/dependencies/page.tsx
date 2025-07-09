"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Filter
} from "lucide-react";
import Link from "next/link";

interface Dependency {
  name: string;
  currentVersion: string;
  requiredVersion: string;
  status: 'missing' | 'outdated' | 'vulnerable' | 'ok';
  description: string;
  lastUpdated: string;
  size: string;
}

export default function DependenciesPage() {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchDependencies = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockDependencies: Dependency[] = [
        {
          name: '@next/font',
          currentVersion: 'not installed',
          requiredVersion: '^13.4.0',
          status: 'missing',
          description: 'Next.js font optimization',
          lastUpdated: '2 days ago',
          size: '2.1 MB'
        },
        {
          name: 'react-query',
          currentVersion: '3.39.0',
          requiredVersion: '^4.0.0',
          status: 'outdated',
          description: 'Data fetching library for React',
          lastUpdated: '1 week ago',
          size: '45 KB'
        },
        {
          name: 'lodash',
          currentVersion: '4.17.20',
          requiredVersion: '^4.17.21',
          status: 'vulnerable',
          description: 'Utility library',
          lastUpdated: '3 months ago',
          size: '531 KB'
        },
        {
          name: 'typescript',
          currentVersion: '5.0.4',
          requiredVersion: '^5.0.0',
          status: 'ok',
          description: 'TypeScript language',
          lastUpdated: '1 day ago',
          size: '34.2 MB'
        },
        {
          name: 'eslint-config-next',
          currentVersion: 'not installed',
          requiredVersion: '^13.4.0',
          status: 'missing',
          description: 'ESLint configuration for Next.js',
          lastUpdated: '5 days ago',
          size: '156 KB'
        },
        {
          name: '@types/node',
          currentVersion: '18.16.0',
          requiredVersion: '^20.0.0',
          status: 'outdated',
          description: 'TypeScript definitions for Node.js',
          lastUpdated: '2 weeks ago',
          size: '2.8 MB'
        }
      ];
      
      setDependencies(mockDependencies);
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
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
                    <Button size="sm" variant="outline">
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
        <Button className="flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Install All Missing
        </Button>
        <Button variant="outline" className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Update All Outdated
        </Button>
        <Button variant="outline" className="flex items-center">
          <ExternalLink className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
} 
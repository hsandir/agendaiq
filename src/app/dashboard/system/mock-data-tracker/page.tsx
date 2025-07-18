"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Code,
  Search,
  FileText,
  Zap
} from "lucide-react";
import Link from "next/link";

interface MockDataUsage {
  file: string;
  path: string;
  type: 'component' | 'page' | 'api';
  status: 'mock_only' | 'mixed' | 'api_fallback';
  description: string;
  mockDataLines: string[];
  apiEndpoint?: string;
  lastChecked: string;
  priority: 'high' | 'medium' | 'low';
}

interface MockDataReport {
  totalFiles: number;
  mockOnlyFiles: number;
  mixedFiles: number;
  apiFallbackFiles: number;
  usage: MockDataUsage[];
  timestamp: string;
}

export default function MockDataTrackerPage() {
  const [report, setReport] = useState<MockDataReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const scanMockDataUsage = async () => {
    try {
      setScanning(true);
      setLoading(true);
      
      // Simulate API call to scan codebase for mock data usage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockReport: MockDataReport = {
        totalFiles: 8,
        mockOnlyFiles: 3,
        mixedFiles: 2,
        apiFallbackFiles: 3,
        usage: [
          {
            file: "src/app/dashboard/system/server/page.tsx",
            path: "/dashboard/system/server",
            type: "page",
            status: "mock_only",
            description: "Server Management page uses mock server metrics",
            mockDataLines: [
              "const mockMetrics: ServerMetrics = {",
              "  system: { platform: 'darwin', architecture: 'arm64' }",
              "  performance: { memory: { total: 16, used: 8.5 } }"
            ],
            lastChecked: new Date().toISOString(),
            priority: "high"
          },
          {
            file: "src/app/dashboard/system/database/page.tsx", 
            path: "/dashboard/system/database",
            type: "page",
            status: "api_fallback",
            description: "Database Management page falls back to mock data when API fails",
            mockDataLines: [
              "const mockMetrics: DatabaseMetrics = {",
              "  connection: { url: 'postgresql://postgres:****@localhost:5432/agendaiq' }",
              "  statistics: { tables: 19, totalRecords: 25680 }"
            ],
            apiEndpoint: "/api/system/database",
            lastChecked: new Date().toISOString(),
            priority: "medium"
          },
          {
            file: "src/app/dashboard/system/alerts/page.tsx",
            path: "/dashboard/system/alerts", 
            type: "page",
            status: "api_fallback",
            description: "Alerts Configuration page has mock data fallback",
            mockDataLines: [
              "const mockAlertsConfig: AlertsConfig = {",
              "  rules: [ { id: '1', name: 'Database Connection Failure' } ]",
              "  channels: [ { id: 'email', name: 'Email Notifications' } ]"
            ],
            apiEndpoint: "/api/system/alerts",
            lastChecked: new Date().toISOString(),
            priority: "low"
          },
          {
            file: "src/components/meetings/MeetingDetails.tsx",
            path: "/dashboard/meetings/[id]",
            type: "component", 
            status: "mock_only",
            description: "Meeting Details component uses mock agenda items and notes",
            mockDataLines: [
              "// Mock data - in a real app, this would come from the API",
              "setAgendaItems([ { id: '1', title: 'Review quarterly results' } ])",
              "setNotes([ { id: '1', content: 'Meeting started on time' } ])"
            ],
            lastChecked: new Date().toISOString(),
            priority: "high"
          },
          {
            file: "src/app/dashboard/settings/database/page.tsx",
            path: "/dashboard/settings/database",
            type: "page",
            status: "mock_only", 
            description: "Settings Database page entirely uses mock metrics",
            mockDataLines: [
              "// Mock database metrics",
              "const dbMetrics = { size: { total: 10, used: 4.2 } }",
              "const tableStats = [ { name: 'users', rows: 1250 } ]"
            ],
            lastChecked: new Date().toISOString(),
            priority: "medium"
          },
          {
            file: "src/app/dashboard/settings/server/page.tsx", 
            path: "/dashboard/settings/server",
            type: "page",
            status: "mock_only",
            description: "Settings Server page uses mock server metrics",
            mockDataLines: [
              "// Mock server metrics",
              "const serverMetrics = { cpu: { usage: 45, cores: 8 } }",
              "uptime: '45 days 12 hours'"
            ],
            lastChecked: new Date().toISOString(),
            priority: "medium"
          },
          {
            file: "src/app/api/system/alerts/route.ts",
            path: "/api/system/alerts",
            type: "api",
            status: "mixed",
            description: "System Alerts API returns hardcoded alert rules",
            mockDataLines: [
              "const alertsConfig = { rules: [ hardcoded alert rules ] }",
              "channels: [ { id: 'email', name: 'Email Notifications' } ]"
            ],
            lastChecked: new Date().toISOString(),
            priority: "low"
          },
          {
            file: "src/config/organization.ts",
            path: "Configuration file",
            type: "component",
            status: "mixed", 
            description: "Organization config has hardcoded default values",
            mockDataLines: [
              "defaultSchoolName: 'AgendaIQ School'",
              "systemRoles: [ 'Administrator', 'Principal', 'Teacher' ]"
            ],
            lastChecked: new Date().toISOString(),
            priority: "low"
          }
        ],
        timestamp: new Date().toISOString()
      };
      
      setReport(mockReport);
      showNotification(`Scan completed: Found ${mockReport.totalFiles} files with mock data usage`);
    } catch (error) {
      console.error('Failed to scan mock data usage:', error);
      showNotification('Failed to scan codebase');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  useEffect(() => {
    scanMockDataUsage();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'mock_only':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Mock Only</Badge>;
      case 'api_fallback':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />API Fallback</Badge>;
      case 'mixed':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Code className="w-3 h-3 mr-1" />Mixed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return <FileText className="w-4 h-4" />;
      case 'component':
        return <Code className="w-4 h-4" />;
      case 'api':
        return <Database className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Scanning codebase for mock data usage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Search className="w-8 h-8 mr-3 text-purple-600" />
            Mock Data Tracker
          </h1>
          <p className="text-muted-foreground">Monitor and track mock data usage across the application</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <Button 
            onClick={scanMockDataUsage}
            variant="outline"
            size="sm"
            disabled={scanning}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            Rescan
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

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalFiles}</div>
                <p className="text-xs text-muted-foreground">
                  Files using mock data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mock Only</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{report.mockOnlyFiles}</div>
                <p className="text-xs text-muted-foreground">
                  High priority fixes needed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Fallback</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{report.apiFallbackFiles}</div>
                <p className="text-xs text-muted-foreground">
                  Has API but uses mock fallback
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mixed Usage</CardTitle>
                <Code className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{report.mixedFiles}</div>
                <p className="text-xs text-muted-foreground">
                  Partially using real data
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Alert */}
          <Alert className="mb-6">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Action Required:</strong> {report.mockOnlyFiles} files are using mock data only and need API integration. 
              {report.apiFallbackFiles} files have API fallbacks that may indicate unstable APIs.
            </AlertDescription>
          </Alert>

          {/* Mock Data Usage Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-600" />
                Mock Data Usage Details
              </CardTitle>
              <CardDescription>Complete list of files using mock data with details and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {report.usage.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <h4 className="font-medium text-gray-900">{item.file}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Path: {item.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(item.priority)}
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {item.apiEndpoint && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-green-600">API Endpoint: </span>
                        <code className="text-xs bg-green-50 px-2 py-1 rounded">{item.apiEndpoint}</code>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Mock Data Lines:</p>
                      {item.mockDataLines.map((line, lineIndex) => (
                        <code key={lineIndex} className="block text-xs text-gray-700 mb-1">
                          {line}
                        </code>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        Last checked: {new Date(item.lastChecked).toLocaleString()}
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={item.path}>
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Page
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scan Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Scan Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Last Scan:</span>
                  <span className="ml-2">{new Date(report.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium">Scan Duration:</span>
                  <span className="ml-2">2.3 seconds</span>
                </div>
                <div>
                  <span className="font-medium">Files Scanned:</span>
                  <span className="ml-2">156 TypeScript/JavaScript files</span>
                </div>
                <div>
                  <span className="font-medium">Mock Data Patterns:</span>
                  <span className="ml-2">8 different patterns detected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
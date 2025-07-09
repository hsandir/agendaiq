"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Bug,
  Settings,
  Wrench,
  Play
} from "lucide-react";
import Link from "next/link";

interface LintStatus {
  summary: {
    totalFiles: number;
    errorFiles: number;
    warningFiles: number;
    cleanFiles: number;
    totalErrors: number;
    totalWarnings: number;
  };
  files: Array<{
    name: string;
    path: string;
    errors: number;
    warnings: number;
    issues: Array<{
      line: number;
      column: number;
      severity: 'error' | 'warning';
      message: string;
      rule: string;
    }>;
  }>;
  recentFixes: Array<{
    timestamp: string;
    type: string;
    count: number;
    files: string[];
  }>;
}

export default function LintErrorManagementPage() {
  const [lintStatus, setLintStatus] = useState<LintStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [notifications, setNotifications] = useState<string[]>([]);

  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const fetchLintStatus = async () => {
    try {
      setLoading(true);
      
      // Mock lint status for demo purposes
      const mockLintStatus: LintStatus = {
        summary: {
          totalFiles: 156,
          errorFiles: 8,
          warningFiles: 12,
          cleanFiles: 136,
          totalErrors: 24,
          totalWarnings: 47
        },
        files: [
          {
            name: "UserManagement.tsx",
            path: "src/components/settings/UserManagement.tsx",
            errors: 5,
            warnings: 2,
            issues: [
              { line: 45, column: 12, severity: 'error', message: 'Unused variable `userId`', rule: 'no-unused-vars' },
              { line: 89, column: 8, severity: 'error', message: 'Missing return type annotation', rule: '@typescript-eslint/explicit-function-return-type' },
              { line: 102, column: 15, severity: 'warning', message: 'Prefer const assertion', rule: 'prefer-const' }
            ]
          },
          {
            name: "SystemPage.tsx",
            path: "src/app/dashboard/system/page.tsx",
            errors: 3,
            warnings: 8,
            issues: [
              { line: 78, column: 22, severity: 'error', message: 'Property does not exist on type', rule: '@typescript-eslint/no-unsafe-member-access' },
              { line: 156, column: 5, severity: 'warning', message: 'React Hook useEffect has missing dependencies', rule: 'react-hooks/exhaustive-deps' }
            ]
          },
          {
            name: "DatabaseAPI.ts",
            path: "src/app/api/database/route.ts",
            errors: 2,
            warnings: 1,
            issues: [
              { line: 34, column: 18, severity: 'error', message: 'Async function has no await expression', rule: 'require-await' }
            ]
          }
        ],
        recentFixes: [
          {
            timestamp: "2024-06-01T10:30:00Z",
            type: "Auto-fix",
            count: 156,
            files: ["prisma/client.ts", "generated files"]
          },
          {
            timestamp: "2024-06-01T09:15:00Z",
            type: "Manual fix",
            count: 23,
            files: ["UserSettings.tsx", "RoleManagement.tsx"]
          }
        ]
      };
      
      setLintStatus(mockLintStatus);
    } catch (error) {
      console.error('Failed to fetch lint status:', error);
      showNotification('Failed to fetch lint status');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFix = async () => {
    try {
      setFixing(true);
      setFixProgress(0);

      // Simulate auto-fix progress
      const interval = setInterval(() => {
        setFixProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 500);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setFixProgress(100);
      showNotification('Auto-fix completed! Fixed 12 issues automatically.');
      
      // Refresh lint status
      await fetchLintStatus();
    } catch (error) {
      console.error('Auto-fix failed:', error);
      showNotification('Auto-fix failed');
    } finally {
      setFixing(false);
      setFixProgress(0);
    }
  };

  useEffect(() => {
    fetchLintStatus();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchLintStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading lint status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/system">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to System
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <FileText className="w-8 h-8 mr-3 text-orange-600" />
              Lint Error Management
            </h1>
            <p className="text-muted-foreground">Manage code quality and linting issues</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleAutoFix}
            variant="outline"
            size="sm"
            disabled={fixing || !lintStatus || lintStatus.summary.totalErrors === 0}
          >
            {fixing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4 mr-2" />
                Auto-fix
              </>
            )}
          </Button>
          <Button 
            onClick={fetchLintStatus}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Auto-fix Progress */}
      {fixing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Auto-fixing lint errors...</span>
                <span className="text-sm text-muted-foreground">{fixProgress}%</span>
              </div>
              <Progress value={fixProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {lintStatus && (
        <>
          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lintStatus.summary.totalFiles}</div>
                <p className="text-xs text-muted-foreground">
                  {lintStatus.summary.cleanFiles} clean files
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <Bug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lintStatus.summary.totalErrors}</div>
                <p className="text-xs text-muted-foreground">
                  in {lintStatus.summary.errorFiles} files
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lintStatus.summary.totalWarnings}</div>
                <p className="text-xs text-muted-foreground">
                  in {lintStatus.summary.warningFiles} files
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((lintStatus.summary.cleanFiles / lintStatus.summary.totalFiles) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Files without issues
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Error Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bug className="h-5 w-5 mr-2 text-red-600" />
                  Error Summary
                </CardTitle>
                <CardDescription>Most problematic files requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lintStatus.files.slice(0, 5).map((file, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.errors > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {file.errors} errors
                          </Badge>
                        )}
                        {file.warnings > 0 && (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                            {file.warnings} warnings
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {lintStatus.summary.totalErrors === 0 && lintStatus.summary.totalWarnings === 0 && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Great! No lint errors or warnings found in your codebase.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Fixes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Fixes
                </CardTitle>
                <CardDescription>Latest automatic and manual fixes applied</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lintStatus.recentFixes.map((fix, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{fix.type}</p>
                          <p className="text-xs text-muted-foreground">
                            Fixed {fix.count} issues • {formatTimestamp(fix.timestamp)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Files: {fix.files.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Issues */}
          {lintStatus.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Detailed Issues
                </CardTitle>
                <CardDescription>Specific lint errors and warnings by file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {lintStatus.files.map((file, fileIndex) => (
                    <div key={fileIndex} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-muted-foreground">{file.path}</p>
                        </div>
                        <div className="flex space-x-2">
                          {file.errors > 0 && (
                            <Badge variant="destructive">
                              {file.errors} errors
                            </Badge>
                          )}
                          {file.warnings > 0 && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              {file.warnings} warnings
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {file.issues.slice(0, 3).map((issue, issueIndex) => (
                          <div key={issueIndex} className="flex items-start space-x-3 text-sm">
                            <div className="flex-shrink-0">
                              {issue.severity === 'error' ? (
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900">{issue.message}</p>
                              <p className="text-gray-500 text-xs">
                                Line {issue.line}:{issue.column} • {issue.rule}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {file.issues.length > 3 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ... and {file.issues.length - 3} more issues
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-8">
            <Button variant="outline" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Run Lint Check
            </Button>
            <Button 
              size="lg"
              onClick={handleAutoFix}
              disabled={fixing || lintStatus.summary.totalErrors === 0}
            >
              <Wrench className="w-4 h-4 mr-2" />
              Auto-fix All Issues
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CodeIcon, 
  TestTubeIcon, 
  BugIcon, 
  ActivityIcon,
  GitBranchIcon,
  DatabaseIcon,
  SettingsIcon,
  FileTextIcon,
  BarChart3Icon,
  PlayIcon,
  RefreshCwIcon,
  DownloadIcon
} from 'lucide-react'
import TestDashboard from '@/components/development/test-dashboard'
import DatabaseManager from '@/components/development/database-manager'
import PerformanceMonitor from '@/components/development/performance-monitor'
import ApiTester from '@/components/development/api-tester'
import LogViewer from '@/components/development/log-viewer'

export default function DevelopmentTools() {
  const [activeTab, setActiveTab] = useState('tests')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Development Tools</h1>
          <p className="text-muted-foreground">Advanced tools for development and testing</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Environment: {process.env.NODE_ENV}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82.5%</div>
            <p className="text-xs text-muted-foreground">+2.3% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Build Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="success">Passing</Badge>
              <span className="text-sm text-muted-foreground">3m 24s</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">All systems operational</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <TestTubeIcon className="h-4 w-4" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <CodeIcon className="h-4 w-4" />
            API Tester
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="git" className="flex items-center gap-2">
            <GitBranchIcon className="h-4 w-4" />
            Git
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <TestDashboard />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <DatabaseManager />
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <ApiTester />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <LogViewer />
        </TabsContent>

        <TabsContent value="git" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Git Operations</CardTitle>
              <CardDescription>Version control management</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Git operations panel coming soon...
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Development Settings</CardTitle>
              <CardDescription>Configure development environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Environment</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Local</option>
                  <option>Staging</option>
                  <option>Production</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Debug Mode</label>
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-muted-foreground">Enable verbose logging</span>
              </div>
              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
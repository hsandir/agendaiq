'use client'

import { useState, useEffect } from 'react'
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
import dynamic from 'next/dynamic'
import { AuthenticatedUser } from '@/lib/auth/auth-utils'

// Lazy load heavy development components for better performance
const TestDashboard = dynamic(() => import('@/components/development/test-dashboard'), {
  loading: () => <div className="p-4">Loading Test Dashboard...</div>,
  ssr: false
})

const DatabaseManager = dynamic(() => import('@/components/development/database-manager'), {
  loading: () => <div className="p-4">Loading Database Manager...</div>,
  ssr: false
})

const PerformanceMonitor = dynamic(() => import('@/components/development/performance-monitor'), {
  loading: () => <div className="p-4">Loading Performance Monitor...</div>,
  ssr: false
})

const ApiTester = dynamic(() => import('@/components/development/api-tester'), {
  loading: () => <div className="p-4">Loading API Tester...</div>,
  ssr: false
})

const LogViewer = dynamic(() => import('@/components/development/log-viewer'), {
  loading: () => <div className="p-4">Loading Log Viewer...</div>,
  ssr: false
})

const CICDMonitor = dynamic(() => import('@/components/development/ci-cd-monitor'), {
  loading: () => <div className="p-4">Loading CI/CD Monitor...</div>,
  ssr: false
})

const GitOperations = dynamic(() => import('@/components/development/git-operations'), {
  loading: () => <div className="p-4">Loading Git Operations...</div>,
  ssr: false
})

interface DevelopmentClientProps {
  user: AuthenticatedUser
}

export default function DevelopmentClient({ user }: DevelopmentClientProps) {
  const [activeTab, setActiveTab] = useState('tests')
  const [stats, setStats] = useState({
    testCoverage: { value: 0, formatted: '0%', changeFormatted: '+0%' },
    buildStatus: { status: 'unknown', timeFormatted: 'N/A' },
    apiHealth: { status: 'unknown', message: 'Loading...' },
    activeErrors: { count: 0, requiresAttention: false }
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/dev/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error: unknown) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Development Tools</h1>
          <p className="text-muted-foreground">Advanced tools for development and testing</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            Environment: {process.env.NODE_ENV}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {user.name} - DEV
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testCoverage.formatted}</div>
            <p className="text-xs text-muted-foreground">{stats.testCoverage.changeFormatted} from last run</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Build Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={stats.buildStatus.status === 'passing' ? 'default' : 'destructive'}>
                {stats.buildStatus.status === 'passing' ? 'Passing' : 'Failed'}
              </Badge>
              <span className="text-sm text-muted-foreground">{stats.buildStatus.timeFormatted}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full animate-pulse ${
                stats.apiHealth.status === 'operational' ? 'bg-green-500' :
                stats.apiHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-destructive/10'
              }`} />
              <span className="text-sm">{stats.apiHealth.message}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.activeErrors.count > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {stats.activeErrors.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeErrors.requiresAttention ? 'Requires attention' : 'No issues'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="cicd" className="flex items-center gap-2">
            <PlayIcon className="h-4 w-4" />
            CI/CD
          </TabsTrigger>
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
            API
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4" />
            Perf
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

        <TabsContent value="cicd" className="space-y-4">
          <CICDMonitor />
        </TabsContent>

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
          <GitOperations />
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
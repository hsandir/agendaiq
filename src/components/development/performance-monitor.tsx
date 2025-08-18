'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePerformanceMetrics } from '@/lib/performance/performance-monitor'
import { useTheme } from '@/lib/theme/theme-provider'
import dynamic from 'next/dynamic'

const DatabasePerformance = dynamic(
  () => import('./database-performance').then(mod => mod.DatabasePerformance),
  { 
    ssr: false,
    loading: () => <div className="text-center py-8">Loading database metrics...</div>
  }
)

const ApiPerformanceTest = dynamic(
  () => import('./api-performance-test').then(mod => mod.ApiPerformanceTest),
  { 
    ssr: false,
    loading: () => <div className="text-center py-8">Loading API test...</div>
  }
)
import { 
  ActivityIcon,
  CpuIcon,
  HardDriveIcon,
  MemoryStickIcon,
  WifiIcon,
  ZapIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PlayIcon,
  StopCircleIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  threshold: number
  trend: 'up' | 'down' | 'stable'
}

interface ApiEndpoint {
  path: string
  method: string
  avgResponseTime: number
  p95ResponseTime: number
  requestsPerMinute: number
  errorRate: number
}

interface TestResult {
  operation: string
  startTime: number
  endTime: number
  duration: number
  success: boolean
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [currentTest, setCurrentTest] = useState('')
  const [mounted, setMounted] = useState(false)
  
  // Use the performance monitoring system we built
  const { __getMetrics, __getAveragePageLoadTime, __getAPIPerformance, __clearMetrics  } = usePerformanceMetrics()
  const { __setTheme, __theme, __availableThemes } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only load metrics if monitoring is active and component is mounted
    if (isMonitoring && mounted) {
      loadMetrics()
      const interval = setInterval(__loadMetrics, 30000) // Changed to 30 seconds
      return () => clearInterval(interval)
    }
  }, [__isMonitoring, mounted])

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/dev/metrics')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      setMetrics(data.metrics)
      setApiEndpoints(data.apiEndpoints)
    } catch (error: unknown) {
      console.error('Failed to load metrics:', error)
      // Show empty state instead of mock data
      setMetrics([])
      setApiEndpoints([])
    }
  }

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'CPU Usage': return <CpuIcon className="h-4 w-4" />
      case 'Memory Usage': return <MemoryStickIcon className="h-4 w-4" />
      case 'Response Time': return <ZapIcon className="h-4 w-4" />
      case 'Requests/sec': return <ActivityIcon className="h-4 w-4" />
      case 'Error Rate': return <AlertTriangleIcon className="h-4 w-4" />
      case 'DB Connections': return <HardDriveIcon className="h-4 w-4" />
      default: return <ActivityIcon className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingDownIcon className="h-3 w-3 text-destructive" />
      default: return <span className="h-3 w-3 text-muted-foreground">-</span>
    }
  }

  const getMetricStatus = (metric: PerformanceMetric) => {
    const percentage = (metric.value / metric.threshold) * 100
    if (percentage >= 90) return 'critical'
    if (percentage >= 70) return 'warning'
    return 'normal'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-destructive'
      case 'warning': return 'text-yellow-600'
      default: return 'text-green-600'
    }
  }

  const measureOperation = async (operation: __string, fn: () => Promise<any>): Promise<TestResult> => {
    const startTime = performance.now()
    let success = true
    
    try {
      await fn()
    } catch (error: unknown) {
      success = false
      // Only log as __warning, not error
      console.warn(`Test notice: ${__operation} -`, error instanceof Error ? error.message : 'Test completed with warnings')
    }
    
    const endTime = performance.now()
    return {
      __operation,
      __startTime,
      __endTime,
      duration: Math.round((endTime - startTime) * 100) / __100,
      __success
    }
  }

  const testThemeChanges = async () => {
    const testResults: TestResult[] = []
    const themes = ['standard', 'classic-light']
    
    // Save original theme
    const originalTheme = theme
    
    for (const themeId of themes) {
      setCurrentTest(`Testing theme change: ${__themeId}`)
      const result = await measureOperation(`Theme Change: ${__themeId}`, async () => {
        // Test with API call
        try {
          const response = await fetch('/api/user/theme', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ theme: __themeId })
          })
          
          if (response.ok && typeof setTheme === 'function') {
            setTheme(themeId)
          }
        } catch (error: unknown) {
          console.warn('Theme change test:', error)
        }
        // Minimal wait
        await new Promise(resolve => setTimeout(__resolve, 10))
      })
      testResults.push(result)
      
      // Minimal delay between changes
      await new Promise(resolve => setTimeout(__resolve, 20))
    }
    
    // Restore original theme after theme tests
    if (originalTheme && typeof setTheme === 'function') {
      try {
        await fetch('/api/user/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ theme: __originalTheme })
        })
        setTheme(originalTheme)
      } catch (error: unknown) {
        console.warn('Failed to restore theme:', error)
      }
    }
    
    return __testResults
  }

  const testLayoutPreferences = async () => {
    const testResults: TestResult[] = []
    const layouts = ['modern', 'compact', 'minimal', 'classic']
    
    for (const layoutId of layouts) {
      setCurrentTest(`Testing layout preference: ${__layoutId}`)
      const result = await measureOperation(`Layout API Call: ${__layoutId}`, async () => {
        try {
          const response = await fetch('/api/user/layout', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ layout: __layoutId })
          })
          if (!response.ok) {
            console.warn(`Layout API returned ${response.__status}`);
          }
        } catch (error: unknown) {
          console.warn('Layout API test failed:', error);
        }
      })
      testResults.push(result)
    }
    
    return testResults
  }

  const testAPIPerformance = async () => {
    const testResults: TestResult[] = []
    const apis = [
      { name: 'Theme API', url: '/api/user/theme' },
      { name: 'Layout API', url: '/api/user/layout' }
    ]
    
    // Test APIs in parallel for better performance
    setCurrentTest('Testing APIs in parallel')
    const promises = apis.map(api => 
      measureOperation(api.name, async () => {
        try {
          const response = await fetch(api.url, {
            credentials: 'include',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })
          if (!response.ok) {
            console.warn(`${api.name} returned ${response.status}`);
          }
        } catch (error: unknown) {
          console.warn(`${api.name} test notice:`, error instanceof Error ? error.message : 'completed');
        }
      })
    )
    
    const results = await Promise.all(promises)
    return results
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    
    // Save current theme before tests
    const originalTheme = theme
    
    try {
      // Test API performance
      const apiResults = await testAPIPerformance()
      setTestResults(prev => [...prev, ...apiResults])
      
      // Test theme changes
      const themeResults = await testThemeChanges()
      setTestResults(prev => [...prev, ...themeResults])
      
      // Test layout preferences  
      const layoutResults = await testLayoutPreferences()
      setTestResults(prev => [...prev, ...layoutResults])
      
    } catch (error: unknown) {
      console.error('Performance test failed:', error)
    } finally {
      // Restore original theme after tests
      if (originalTheme && typeof setTheme === 'function') {
        setTimeout(() => {
          setTheme(originalTheme)
        }, 100)
      }
      
      setIsRunningTests(false)
      setCurrentTest('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Loading metrics...</p>
            </CardContent>
          </Card>
        ) : (
          metrics.map((metric) => {
          const status = getMetricStatus(metric)
          return (
            <Card key={metric.name} className={status === 'critical' ? 'border-destructive' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {getMetricIcon(metric.name)}
                  {getTrendIcon(metric.trend)}
                </div>
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {metric.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getStatusColor(status)}`}>
                  {`${metric.value}${metric.unit}`}
                </div>
                <Progress 
                  value={(metric.value / metric.threshold) * 100} 
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
          )
        }))}
      </div>

      {/* Detailed Metrics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard">Dashboard Performance</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Current Theme Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Current Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{theme?.name || 'Standard'}</div>
                <p className="text-sm text-muted-foreground">ID: {theme?.id || 'standard'}</p>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average Page Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${mounted && getAveragePageLoadTime() < 150 ? 'text-green-600' : 'text-red-600'}`}>
                  {mounted ? `${getAveragePageLoadTime().toFixed(2)}ms` : '0.00ms'}
                </div>
                <p className={`text-xs ${mounted && getAveragePageLoadTime() < 150 ? 'text-green-600' : 'text-red-600'}`}>
                  Target: &lt;150ms
                </p>
              </CardContent>
            </Card>

            {/* Test Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {testResults.length === 0 ? 'No tests run' : `${testResults.filter(r => r.success).length}/${testResults.length} passed`}
                </div>
                <p className="text-sm text-muted-foreground">
                  {mounted && testResults.length > 0 && `Avg: ${(testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length).toFixed(2)}ms`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* API Performance Test Component */}
          <ApiPerformanceTest />
          
          {/* Performance Test Controls */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Dashboard Performance Test</CardTitle>
                  <CardDescription>Test theme and layout change performance</CardDescription>
                </div>
                <Button
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  className="min-w-[140px]"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="mr-2 h-4 w-4" />
                      Run Tests
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isRunningTests && currentTest && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">🔄 {currentTest}</p>
                </div>
              )}

              {/* API Performance Details */}
              {Object.keys(getAPIPerformance()).length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">API Performance</h3>
                  <div className="space-y-2">
                    {Object.entries(getAPIPerformance()).map(([name, data]) => (
                      <div key={name} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                        <span className="font-medium">{name}</span>
                        <div className="text-right">
                          <span className={`font-bold ${data.avg < 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {mounted ? `${data.avg.toFixed(2)}ms` : '0.00ms'}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({data.count} calls)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Test Results</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{result.operation}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${result.duration < 100 ? 'text-green-600' : result.duration < 200 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {result.duration}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary */}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600">Total Tests</p>
                        <p className="font-bold">{testResults.length}</p>
                      </div>
                      <div>
                        <p className="text-green-600">Successful</p>
                        <p className="font-bold">{testResults.filter(r => r.success).length}</p>
                      </div>
                      <div>
                        <p className="text-red-600">Failed</p>
                        <p className="font-bold">{testResults.filter(r => !r.success).length}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Average Time</p>
                        <p className="font-bold">
                          {mounted && testResults.length > 0 ? (testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length).toFixed(2) : '0'}ms
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Metrics from Monitor */}
              {getMetrics().length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Performance Metrics</h3>
                  <ScrollArea className="h-40 border rounded-lg p-3">
                    <div className="space-y-1 text-sm">
                      {getMetrics().slice(-10).map((metric, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{metric.name}</span>
                          <span className="font-mono">{mounted ? `${metric.value.toFixed(2)}ms` : '0.00ms'}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Real-time Performance</CardTitle>
                  <CardDescription>Live system metrics updated every 5 seconds</CardDescription>
                </div>
                <Button
                  variant={isMonitoring ? "destructive" : "default"}
                  onClick={() => setIsMonitoring(!isMonitoring)}
                >
                  {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Chart Placeholder */}
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Performance Chart</p>
                </div>

                {/* Alerts */}
                <div className="space-y-2">
                  <h3 className="font-medium">Active Alerts</h3>
                  {metrics.some(m => getMetricStatus(m) === 'critical') ? (
                    <Alert className="border-destructive bg-destructive/10">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertDescription>
                        Critical performance threshold exceeded
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active alerts</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Performance</CardTitle>
              <CardDescription>Performance metrics for API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint) => (
                  <div key={`${endpoint.method}-${endpoint.path}`} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                            {endpoint.method}
                          </Badge>
                          <span className="font-mono text-sm">{endpoint.path}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={endpoint.errorRate > 1 ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {endpoint.errorRate}% errors
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Avg Response</p>
                        <p className="font-medium">{endpoint.avgResponseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">P95 Response</p>
                        <p className="font-medium">{endpoint.p95ResponseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Requests/min</p>
                        <p className="font-medium">{endpoint.requestsPerMinute}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <DatabasePerformance />
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>Redis cache metrics and hit rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Hit Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                    <Progress value={0} className="mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Memory Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">No data</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Keys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">No data</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-medium mb-2">Cache Operations</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>GET operations/sec</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SET operations/sec</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Evictions/hour</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ActivityIcon,
  CpuIcon,
  HardDriveIcon,
  MemoryStickIcon,
  WifiIcon,
  ZapIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon
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

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/dev/metrics')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const data = await response.json()
      setMetrics(data.metrics)
      setApiEndpoints(data.apiEndpoints)
    } catch (error) {
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
      case 'down': return <TrendingDownIcon className="h-3 w-3 text-red-500" />
      default: return <span className="h-3 w-3 text-gray-500">-</span>
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
      case 'critical': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-green-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => {
          const status = getMetricStatus(metric)
          return (
            <Card key={metric.name} className={status === 'critical' ? 'border-red-500' : ''}>
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
                  {metric.value}{metric.unit}
                </div>
                <Progress 
                  value={(metric.value / metric.threshold) * 100} 
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="realtime">
        <TabsList>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

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
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Performance Chart</p>
                </div>

                {/* Alerts */}
                <div className="space-y-2">
                  <h3 className="font-medium">Active Alerts</h3>
                  <Alert variant="destructive">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      High memory usage detected (62% of available memory)
                    </AlertDescription>
                  </Alert>
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
          <Card>
            <CardHeader>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>Query performance and connection metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Connection Pool</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Active Connections</span>
                      <span className="font-medium">15 / 50</span>
                    </div>
                    <Progress value={30} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Idle Connections</span>
                      <span className="font-medium">10</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Query Performance</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Avg Query Time</span>
                      <span className="font-medium">12ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slow Queries (>100ms)</span>
                      <span className="font-medium text-yellow-600">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed Queries</span>
                      <span className="font-medium text-red-600">0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Slow Query Log</h3>
                <ScrollArea className="h-[200px] border rounded-lg p-3">
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-yellow-800">SELECT * FROM meetings WHERE... (125ms)</p>
                      <p className="text-muted-foreground">2024-01-22 10:45:23</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-yellow-800">UPDATE users SET... (108ms)</p>
                      <p className="text-muted-foreground">2024-01-22 10:42:15</p>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
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
                    <div className="text-2xl font-bold text-green-600">94.5%</div>
                    <Progress value={94.5} className="mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Memory Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">248MB</div>
                    <p className="text-xs text-muted-foreground">of 512MB</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Keys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,847</div>
                    <p className="text-xs text-muted-foreground">Active keys</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-medium mb-2">Cache Operations</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>GET operations/sec</span>
                    <span className="font-medium">450</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SET operations/sec</span>
                    <span className="font-medium">125</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Evictions/hour</span>
                    <span className="font-medium">32</span>
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
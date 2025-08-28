'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ServerIcon,
  DatabaseIcon,
  GlobeIcon,
  AlertCircleIcon,
  ZapIcon,
  MemoryStickIcon,
  HardDriveIcon,
  WifiIcon
} from 'lucide-react'
import { AuthenticatedUser } from '@/lib/auth/auth-utils'

interface HealthClientProps {
  user: AuthenticatedUser
}

interface HealthMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastChecked: Date
  threshold: {
    warning: number
    critical: number
  }
}

interface SystemCheck {
  id: string
  name: string
  description: string
  status: 'passing' | 'warning' | 'failing'
  lastRun: Date
  duration: number
  details: string[]
}

interface HealthData {
  metrics: HealthMetric[]
  systemChecks: SystemCheck[]
  overallHealth: {
    score: number
    status: 'healthy' | 'degraded' | 'critical'
    uptime: string
  }
  alerts: Array<{
    id: string
    type: 'info' | 'warning' | 'error'
    message: string
    timestamp: Date
  }>
}

export default function HealthClient({ user }: HealthClientProps) {
  const [healthData, setHealthData] = useState<HealthData>({
    metrics: [],
    systemChecks: [],
    overallHealth: {
      score: 0,
      status: 'healthy',
      uptime: '0s'
    },
    alerts: []
  })
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const fetchHealthData = useCallback(async () => {
    try {
      const response = await fetch('/api/system/health');
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
        setLastRefresh(new Date())
      } else {
        console.error('Failed to fetch health data');
      }
    } catch (error: unknown) {
      console.error('Error fetching health data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [])

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [autoRefresh, fetchHealthData])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passing':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'critical':
      case 'failing':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'degraded':
        return <AlertCircleIcon className="h-4 w-4 text-orange-500" />
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDownIcon className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passing':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
      case 'failing':
        return 'bg-red-500'
      case 'degraded':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleRefresh = () => {
    setIsLoading(true);
    fetchHealthData();
  }

  const formatDuration = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
  }

  const formatUptime = (uptime: string) => {
    return uptime ?? '0s'
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Health Monitor</h1>
          <p className="text-muted-foreground">Real-time monitoring of application health and performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            Health Score: {healthData.overallHealth.score}%
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {user.name} - OPS
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthData.overallHealth.status)}
            System Overview
          </CardTitle>
          <CardDescription>
            Last updated: {lastRefresh.toLocaleTimeString()} | 
            Uptime: {formatUptime(healthData.overallHealth.uptime)} |
            Auto-refresh: {autoRefresh ? 'On' : 'Off'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Health Score</span>
                <span>{healthData.overallHealth.score}%</span>
              </div>
              <Progress value={healthData.overallHealth.score} className="h-2" />
            </div>
            <div className="flex items-center justify-center">
              <div className={`h-12 w-12 rounded-full ${getStatusColor(healthData.overallHealth.status)} flex items-center justify-center`}>
                {getStatusIcon(healthData.overallHealth.status)}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-lg font-semibold capitalize">
                {healthData.overallHealth.status}
              </div>
              <div className="text-sm text-muted-foreground">
                System Status
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {healthData.alerts.length > 0 && (
        <div className="space-y-2">
          {healthData.alerts.map((alert) => (
            <Alert 
              key={alert.id} 
              className={alert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}
            >
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                {alert.message} - {alert.timestamp.toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <ZapIcon className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <ServerIcon className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="connectivity" className="flex items-center gap-2">
            <WifiIcon className="h-4 w-4" />
            Connectivity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData.systemChecks.map((check) => (
              <Card key={check.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{check.name}</span>
                    {getStatusIcon(check.status)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {check.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Last Run:</span>
                      <span>{check.lastRun.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Duration:</span>
                      <span>{formatDuration(check.duration)}</span>
                    </div>
                    {check.details.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {check.details.map((detail, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            • {detail}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthData.metrics
              .filter(metric => ['response_time', 'throughput', 'error_rate'].includes(metric.id))
              .map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{metric.name}</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      {getStatusIcon(metric.status)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value}{metric.unit}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Updated: {metric.lastChecked.toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData.metrics
              .filter(metric => ['cpu_usage', 'memory_usage', 'disk_usage'].includes(metric.id))
              .map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {metric.id === 'cpu_usage' && <ZapIcon className="h-4 w-4" />}
                      {metric.id === 'memory_usage' && <MemoryStickIcon className="h-4 w-4" />}
                      {metric.id === 'disk_usage' && <HardDriveIcon className="h-4 w-4" />}
                      {metric.name}
                    </span>
                    {getStatusIcon(metric.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current</span>
                      <span>{metric.value}{metric.unit}</span>
                    </div>
                    <Progress 
                      value={metric.value} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Warning: {metric.threshold.warning}{metric.unit}</span>
                      <span>Critical: {metric.threshold.critical}{metric.unit}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connectivity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthData.metrics
              .filter(metric => ['database_connectivity', 'external_apis', 'cdn_status'].includes(metric.id))
              .map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {metric.id === 'database_connectivity' && <DatabaseIcon className="h-4 w-4" />}
                      {metric.id === 'external_apis' && <GlobeIcon className="h-4 w-4" />}
                      {metric.id === 'cdn_status' && <WifiIcon className="h-4 w-4" />}
                      {metric.name}
                    </span>
                    {getStatusIcon(metric.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span>{metric.value}{metric.unit}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last checked: {metric.lastChecked.toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
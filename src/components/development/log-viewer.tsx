'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon
} from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  context?: string
  message: string
  data?: Record<string, any>
  userId?: number
  requestId?: string
}

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [contextFilter, setContextFilter] = useState<string>('all')
  const [isLive, setIsLive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    loadLogs()
    if (isLive && !isPaused) {
      const interval = setInterval(loadLogs, 2000)
      return () => clearInterval(interval)
    }
  }, [isLive, isPaused])

  const loadLogs = async () => {
    // Mock log data
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        context: 'auth',
        message: 'User login successful',
        data: { email: 'user@example.com' },
        userId: 1,
        requestId: 'req-123',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000).toISOString(),
        level: 'warn',
        context: 'meetings',
        message: 'Meeting creation rate limit warning',
        data: { userId: 2, attempts: 9 },
        requestId: 'req-124',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 2000).toISOString(),
        level: 'error',
        context: 'database',
        message: 'Database connection timeout',
        data: { error: 'ETIMEDOUT', host: 'localhost' },
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 3000).toISOString(),
        level: 'debug',
        context: 'api',
        message: 'API request received',
        data: { method: 'GET', path: '/api/users' },
        requestId: 'req-125',
      },
    ]

    setLogs(prevLogs => {
      const newLogs = [...mockLogs, ...prevLogs]
      return newLogs.slice(0, 1000) // Keep last 1000 logs
    })
  }

  const clearLogs = () => {
    setLogs([])
  }

  const exportLogs = () => {
    const data = JSON.stringify(filteredLogs, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString()}.json`
    a.click()
  }

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'debug': return 'secondary'
      case 'info': return 'default'
      case 'warn': return 'warning'
      case 'error': return 'destructive'
      default: return 'secondary'
    }
  }

  const getContextColor = (context?: string) => {
    if (!context) return 'text-gray-500'
    const colors = {
      auth: 'text-blue-600',
      meetings: 'text-green-600',
      database: 'text-purple-600',
      api: 'text-orange-600',
      security: 'text-red-600',
    }
    return colors[context] || 'text-gray-600'
  }

  const contexts = ['all', ...new Set(logs.map(log => log.context).filter(Boolean))]

  const filteredLogs = logs.filter(log => {
    const matchesFilter = log.message.toLowerCase().includes(filter.toLowerCase()) ||
                         JSON.stringify(log.data).toLowerCase().includes(filter.toLowerCase())
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    const matchesContext = contextFilter === 'all' || log.context === contextFilter
    return matchesFilter && matchesLevel && matchesContext
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Application Logs</CardTitle>
              <CardDescription>Real-time application log viewer</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={isLive ? "destructive" : "default"}
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? 'Stop Live' : 'Start Live'}
              </Button>
              {isLive && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="outline" onClick={loadLogs}>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportLogs}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" onClick={clearLogs}>
                <TrashIcon className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px]">
                <FilterIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Context" />
              </SelectTrigger>
              <SelectContent>
                {contexts.map(context => (
                  <SelectItem key={context} value={context}>
                    {context === 'all' ? 'All Contexts' : context}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Log stats */}
          <div className="flex space-x-4 mb-4 text-sm">
            <div>Total: <span className="font-medium">{filteredLogs.length}</span></div>
            <div>Errors: <span className="font-medium text-red-600">
              {filteredLogs.filter(l => l.level === 'error').length}
            </span></div>
            <div>Warnings: <span className="font-medium text-yellow-600">
              {filteredLogs.filter(l => l.level === 'warn').length}
            </span></div>
          </div>

          {/* Log entries */}
          <ScrollArea className="h-[600px] border rounded-lg">
            <div className="p-4 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No logs found
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 border rounded-lg font-mono text-xs ${
                      log.level === 'error' ? 'border-red-200 bg-red-50' :
                      log.level === 'warn' ? 'border-yellow-200 bg-yellow-50' :
                      ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                          {log.level.toUpperCase()}
                        </Badge>
                        {log.context && (
                          <span className={`font-medium ${getContextColor(log.context)}`}>
                            [{log.context}]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500">
                        {log.userId && <span>User: {log.userId}</span>}
                        {log.requestId && <span>Req: {log.requestId}</span>}
                      </div>
                    </div>
                    <div className="text-gray-800">{log.message}</div>
                    {log.data && Object.keys(log.data).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-gray-600">
                        {JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
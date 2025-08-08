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
  }, [isLive, isPaused, levelFilter, contextFilter])

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams({
        level: levelFilter,
        context: contextFilter,
        limit: '100',
        offset: '0'
      })
      
      const response = await fetch(`/api/dev/logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch logs')
      
      const data = await response.json()
      
      if (isLive && !isPaused) {
        // In live mode, prepend new logs
        setLogs(prevLogs => {
          const existingIds = new Set(prevLogs.map(log => log.id))
          const newLogs = data.logs.filter((log: LogEntry) => !existingIds.has(log.id))
          return [...newLogs, ...prevLogs].slice(0, 1000) // Keep last 1000 logs
        })
      } else {
        // In normal mode, replace logs
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
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
      case 'warn': return 'secondary'
      case 'error': return 'destructive'
      default: return 'secondary'
    }
  }

  const getContextColor = (context?: string) => {
    if (!context) return 'text-muted-foreground'
    const colors: Record<string, string> = {
      auth: 'text-primary',
      meetings: 'text-green-600',
      database: 'text-secondary',
      api: 'text-orange-600',
      security: 'text-destructive',
    }
    return colors[context] || 'text-muted-foreground'
  }

  const contexts = ['all', ...new Set(logs.map(log => log.context).filter(Boolean) as string[])]

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
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
            <div>Errors: <span className="font-medium text-destructive">
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
                      log.level === 'error' ? 'border-destructive bg-destructive/10' :
                      log.level === 'warn' ? 'border-yellow-200 bg-yellow-50' :
                      ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
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
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        {log.userId && <span>User: {log.userId}</span>}
                        {log.requestId && <span>Req: {log.requestId}</span>}
                      </div>
                    </div>
                    <div className="text-foreground">{log.message}</div>
                    {log.data && Object.keys(log.data).length > 0 && (
                      <div className="mt-2 p-2 bg-muted rounded text-muted-foreground">
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
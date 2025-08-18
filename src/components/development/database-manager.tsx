'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  DatabaseIcon,
  RefreshCwIcon,
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  PlayIcon,
  SaveIcon,
  AlertCircleIcon
} from 'lucide-react'

export default function DatabaseManager() {
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [queryResults, setQueryResults] = useState<any>(null)
  const [backups, setBackups] = useState<Array<{name: string, size: string, date: string}>>([])
  const [stats, setStats] = useState({ tables: 0, records: 0 })
  const [activeTab, setActiveTab] = useState('operations')

  useEffect(() => {
    loadStats()
    loadBackups()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/dev/database/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error: unknown) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/dev/database/backups')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      }
    } catch (error: unknown) {
      console.error('Failed to load backups:', error)
    }
  }

  const runMigrations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dev/database/migrate', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Migration result:', data)
    } catch (error: unknown) {
      console.error('Migration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const seedDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dev/database/seed', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Seed result:', data)
    } catch (error: unknown) {
      console.error('Seed failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const seedDevData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dev/database/seed-dev', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`Development data seeded! Created ${data.counts.newLogs} new logs.`)
        loadStats()
        loadBackups()
      } else {
        alert('Failed to seed development data')
      }
    } catch (error: unknown) {
      console.error('Seed dev data failed:', error)
      alert('Failed to seed development data')
    } finally {
      setIsLoading(false)
    }
  }

  const resetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete all data!')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/dev/database/reset', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Reset result:', data)
    } catch (error: unknown) {
      console.error('Reset failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const executeQuery = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dev/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await response.json()
      setQueryResults(data)
    } catch (error: unknown) {
      console.error('Query failed:', error)
      setQueryResults({ error: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Connected</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">PostgreSQL 15.2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tables || 0}</div>
            <p className="text-xs text-muted-foreground">Active tables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.records?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="query">Query Runner</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Operations</CardTitle>
              <CardDescription>Manage your database with common operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={runMigrations}
                  disabled={isLoading}
                  className="w-full"
                >
                  <DatabaseIcon className="mr-2 h-4 w-4" />
                  Run Migrations
                </Button>
                <Button
                  onClick={seedDatabase}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Seed Database
                </Button>
                <Button
                  onClick={seedDevData}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full"
                >
                  <DatabaseIcon className="mr-2 h-4 w-4" />
                  Seed Dev Data
                </Button>
                <Button
                  onClick={resetDatabase}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Reset Database
                </Button>
                <Button
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Sync Schema
                </Button>
              </div>

              <Alert>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  These operations are only available in development environment
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Runner</CardTitle>
              <CardDescription>Execute raw SQL queries (Development only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="SELECT * FROM users LIMIT 10;"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="font-mono text-sm h-32"
              />
              <Button
                onClick={executeQuery}
                disabled={isLoading || !query}
                className="w-full"
              >
                <PlayIcon className="mr-2 h-4 w-4" />
                Execute Query
              </Button>

              {queryResults && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Results:</h3>
                  <ScrollArea className="h-[300px] border rounded-lg p-4">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(queryResults, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>View and manage your database structure</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {['users', 'staff', 'meetings', 'roles', 'departments'].map((table) => (
                    <div key={table} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{table}</h4>
                        <Badge variant="outline">Table</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• id (integer, primary key)</p>
                        <p>• created_at (timestamp)</p>
                        <p>• updated_at (timestamp)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Manage database backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="w-full">
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Create Backup
                </Button>
                <Button variant="outline" className="w-full">
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Restore from Backup
                </Button>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recent Backups</h3>
                <div className="space-y-2">
                  {backups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No backups available</p>
                  ) : (
                    backups.map((backup) => (
                    <div key={backup.name} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{backup.name}</p>
                        <p className="text-xs text-muted-foreground">{backup.date} • {backup.size}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
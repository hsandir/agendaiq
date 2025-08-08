'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  SendIcon,
  SaveIcon,
  ClockIcon,
  CodeIcon,
  KeyIcon,
  PlusIcon,
  TrashIcon
} from 'lucide-react'

interface RequestHistory {
  id: string
  method: string
  url: string
  status: number
  duration: number
  timestamp: string
}

interface SavedRequest {
  id: string
  name: string
  method: string
  url: string
  headers: Record<string, string>
  body?: string
}

export default function ApiTester() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('/api/')
  const [headers, setHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json',
  })
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<RequestHistory[]>([])
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])
  const [activeTab, setActiveTab] = useState('headers')

  const sendRequest = async () => {
    setIsLoading(true)
    const startTime = Date.now()

    try {
      const options: RequestInit = {
        method,
        headers: {
          ...headers,
          // Add auth token if available
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      }

      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        options.body = body
      }

      const res = await fetch(url, options)
      const duration = Date.now() - startTime
      const data = await res.json()

      const result = {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
        duration,
      }

      setResponse(result)

      // Add to history
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        method,
        url,
        status: res.status,
        duration,
        timestamp: new Date().toISOString(),
      }
      setHistory([historyItem, ...history.slice(0, 19)])
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'An error occurred',
        duration: Date.now() - startTime,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveRequest = () => {
    const name = prompt('Enter a name for this request:')
    if (!name) return

    const savedRequest: SavedRequest = {
      id: Date.now().toString(),
      name,
      method,
      url,
      headers,
      body,
    }

    setSavedRequests([...savedRequests, savedRequest])
  }

  const loadRequest = (request: SavedRequest) => {
    setMethod(request.method)
    setUrl(request.url)
    setHeaders(request.headers)
    setBody(request.body || '')
  }

  const addHeader = () => {
    const key = prompt('Header name:')
    const value = prompt('Header value:')
    if (key && value) {
      setHeaders({ ...headers, [key]: value })
    }
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers }
    delete newHeaders[key]
    setHeaders(newHeaders)
  }

  const getStatusBadgeVariant = (status: number) => {
    if (status >= 200 && status < 300) return 'success'
    if (status >= 300 && status < 400) return 'warning'
    if (status >= 400 && status < 500) return 'destructive'
    if (status >= 500) return 'destructive'
    return 'secondary'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Request Builder */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>API Request Builder</CardTitle>
          <CardDescription>Test your API endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter request URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={sendRequest} disabled={isLoading}>
              <SendIcon className="mr-2 h-4 w-4" />
              Send
            </Button>
            <Button variant="outline" onClick={saveRequest}>
              <SaveIcon className="h-4 w-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="auth">Auth</TabsTrigger>
            </TabsList>

            <TabsContent value="headers" className="space-y-2">
              {Object.entries(headers).map(([key, value]) => (
                <div key={key} className="flex space-x-2">
                  <Input value={key} disabled className="flex-1" />
                  <Input value={value} disabled className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(key)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addHeader} className="w-full">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Header
              </Button>
            </TabsContent>

            <TabsContent value="body">
              <Textarea
                placeholder="Request body (JSON)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="h-48 font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="auth" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Auth Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select auth type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="api-key">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Token</label>
                <Input type="password" placeholder="Enter token" />
              </div>
            </TabsContent>
          </Tabs>

          {/* Response */}
          {response && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Response</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusBadgeVariant(response.status)}>
                    {response.status} {response.statusText}
                  </Badge>
                  <Badge variant="outline">
                    <ClockIcon className="mr-1 h-3 w-3" />
                    {response.duration}ms
                  </Badge>
                </div>
              </div>
              <Tabs defaultValue="body">
                <TabsList>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>
                <TabsContent value="body">
                  <ScrollArea className="h-[300px] border rounded-lg p-4">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(response.data || response.error, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="headers">
                  <ScrollArea className="h-[300px] border rounded-lg p-4">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(response.headers, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="raw">
                  <ScrollArea className="h-[300px] border rounded-lg p-4">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Saved Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Saved Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[250px]">
              <div className="p-4 space-y-2">
                {savedRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No saved requests
                  </p>
                ) : (
                  savedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-2 border rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() => loadRequest(request)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{request.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {request.method}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.url}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Request History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[250px]">
              <div className="p-4 space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No requests yet
                  </p>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 border rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() => setUrl(item.url)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {item.method}
                          </Badge>
                          <Badge 
                            variant={getStatusBadgeVariant(item.status)} 
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.duration}ms
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {item.url}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
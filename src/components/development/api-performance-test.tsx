'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Zap, TrendingUp, AlertCircle } from 'lucide-react'

interface TestResult {
  endpoint: string
  time: number
  status: number
  cached?: boolean
  error?: string
}

export function ApiPerformanceTest() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const [testCount, setTestCount] = useState(0)

  const testEndpoint = async (url: string, method = 'GET', body?: any): Promise<TestResult> => {
    const start = performance.now()
    try {
      const response = await fetch(url, {
        method,
        headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include'
      })
      
      const time = performance.now() - start
      const headers = Object.fromEntries(response.headers.entries())
      
      return {
        endpoint: url,
        time: Math.round(time * 100) / 100,
        status: response.status,
        cached: headers['x-cache'] === 'HIT'
      }
    } catch (error) {
      return {
        endpoint: url,
        time: performance.now() - start,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const runTests = async () => {
    setTesting(true)
    setResults([])
    
    const newResults: TestResult[] = []
    
    // Test original theme API
    newResults.push(await testEndpoint('/api/user/theme'))
    
    // Test fast theme API
    newResults.push(await testEndpoint('/api/user/theme-fast'))
    
    // Test original layout API
    newResults.push(await testEndpoint('/api/user/layout'))
    
    // Test fast layout API
    newResults.push(await testEndpoint('/api/user/layout-fast'))
    
    // Test multiple calls to see caching
    newResults.push(await testEndpoint('/api/user/theme'))
    newResults.push(await testEndpoint('/api/user/theme-fast'))
    newResults.push(await testEndpoint('/api/user/layout'))
    newResults.push(await testEndpoint('/api/user/layout-fast'))
    
    // Test PUT requests
    newResults.push(await testEndpoint('/api/user/theme', 'PUT', { theme: 'standard' }))
    newResults.push(await testEndpoint('/api/user/theme-fast', 'PUT', { theme: 'standard' }))
    newResults.push(await testEndpoint('/api/user/layout', 'PUT', { layout: 'modern' }))
    newResults.push(await testEndpoint('/api/user/layout-fast', 'PUT', { layout: 'modern' }))
    
    setResults(newResults)
    setTestCount(prev => prev + 1)
    setTesting(false)
  }

  const getAverageTime = (endpoint: string) => {
    const endpointResults = results.filter(r => r.endpoint === endpoint && r.status === 200)
    if (endpointResults.length === 0) return null
    const avg = endpointResults.reduce((sum, r) => sum + r.time, 0) / endpointResults.length
    return Math.round(avg * 100) / 100
  }

  const getStatusColor = (time: number) => {
    if (time < 50) return 'text-green-600'
    if (time < 200) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>API Performance Comparison</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Compare original vs optimized API endpoints
            </p>
          </div>
          <Button onClick={runTests} disabled={testing}>
            {testing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {testCount > 0 && (
          <div className="mb-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Test #{testCount} completed. Run multiple times to see caching effects.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Original Theme API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getAverageTime('/api/user/theme') ? getStatusColor(getAverageTime('/api/user/theme')!) : ''}`}>
                    {getAverageTime('/api/user/theme')?.toFixed(2) || 'N/A'}ms
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fast Theme API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getAverageTime('/api/user/theme-fast') ? getStatusColor(getAverageTime('/api/user/theme-fast')!) : ''}`}>
                    {getAverageTime('/api/user/theme-fast')?.toFixed(2) || 'N/A'}ms
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Original Layout API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getAverageTime('/api/user/layout') ? getStatusColor(getAverageTime('/api/user/layout')!) : ''}`}>
                    {getAverageTime('/api/user/layout')?.toFixed(2) || 'N/A'}ms
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fast Layout API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getAverageTime('/api/user/layout-fast') ? getStatusColor(getAverageTime('/api/user/layout-fast')!) : ''}`}>
                    {getAverageTime('/api/user/layout-fast')?.toFixed(2) || 'N/A'}ms
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Detailed Results */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Detailed Results</h3>
              {results.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{result.endpoint}</span>
                    {result.cached && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">CACHED</span>
                    )}
                    {result.error && (
                      <span className="text-xs text-red-600">{result.error}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${result.status === 200 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.status}
                    </span>
                    <span className={`font-bold ${getStatusColor(result.time)}`}>
                      {result.time.toFixed(2)}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Improvement */}
            {getAverageTime('/api/user/theme') && getAverageTime('/api/user/theme-fast') && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">
                    Performance Improvement: {Math.round((1 - getAverageTime('/api/user/theme-fast')! / getAverageTime('/api/user/theme')!) * 100)}% faster
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Run Tests" to compare API performance
          </div>
        )}
      </CardContent>
    </Card>
  )
}
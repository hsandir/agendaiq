'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  PlayIcon, 
  SquareIcon, 
  RefreshCwIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  FileTextIcon,
  BarChart2Icon
} from 'lucide-react'

interface TestSuite {
  name: string
  path: string
  tests: number
  passed?: number
  failed?: number
  skipped?: number
  duration?: number
  status: 'idle' | 'running' | 'passed' | 'failed'
}

interface TestResult {
  suite: string
  test: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
}

interface CoverageReport {
  statements: { total: number; covered: number; percentage: number }
  branches: { total: number; covered: number; percentage: number }
  functions: { total: number; covered: number; percentage: number }
  lines: { total: number; covered: number; percentage: number }
}

export default function TestDashboard() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [coverage, setCoverage] = useState<CoverageReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState("results")
  const [output, setOutput] = useState<string[]>([])

  // Load available test suites
  useEffect(() => {
    loadTestSuites()
  }, [])

  const loadTestSuites = async () => {
    try {
      const response = await fetch('/api/tests/suites')
      const data = await response.json()
      setTestSuites(data.suites)
    } catch (error: unknown) {
      console.error('Failed to load test suites:', error)
    }
  }

  const runTests = async (suitePath?: string) => {
    setIsRunning(true)
    setOutput([])
    setTestResults([])
    
    try {
      const response = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite: suitePath })
      })
      
      if (!response.ok) throw new Error('Failed to run tests')
      
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(Boolean)
        
        lines.forEach(line => {
          try {
            const data = JSON.parse(line)
            
            if (data.type === 'output') {
              setOutput(prev => [...prev, data.message])
            } else if (data.type === 'result') {
              setTestResults(prev => [...prev, data.result])
            } else if (data.type === 'coverage') {
              setCoverage(data.coverage)
            } else if (data.type === 'suite-update') {
              setTestSuites(prev => prev.map(suite => 
                suite.path === data.suite.path ? { ...suite, ...data.suite } : suite
              ))
            }
          } catch (e: unknown) {
            setOutput(prev => [...prev, line])
          }
        })
      }
    } catch (error: unknown) {
      console.error('Test run failed:', error)
      setOutput(prev => [...prev, `Error: ${error}`])
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-destructive" />
      case 'running':
        return <RefreshCwIcon className="h-4 w-4 animate-spin text-primary" />
      default:
        return <ClockIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-destructive'
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Test Dashboard</h1>
          <p className="text-muted-foreground">Run and monitor your test suites</p>
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => runTests()}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <SquareIcon className="mr-2 h-4 w-4" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={loadTestSuites}
            disabled={isRunning}
          >
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Suites List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Test Suites</CardTitle>
            <CardDescription>Available test suites</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-2">
                {testSuites.map((suite) => (
                  <div
                    key={suite.path}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSuite === suite.path
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedSuite(suite.path)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(suite.status)}
                        <span className="font-medium">{suite.name}</span>
                      </div>
                      <Badge variant={suite.status === 'passed' ? 'default' : suite.status === 'failed' ? 'destructive' : 'secondary'}>
                        {suite.tests} tests
                      </Badge>
                    </div>
                    {suite.duration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {suite.passed || 0} passed, {suite.failed || 0} failed • {suite.duration}ms
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        runTests(suite.path)
                      }}
                      disabled={isRunning}
                    >
                      Run Suite
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Results and Output */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="results" className="flex-1">
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Results
                </TabsTrigger>
                <TabsTrigger value="output" className="flex-1">
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Output
                </TabsTrigger>
                <TabsTrigger value="coverage" className="flex-1">
                  <BarChart2Icon className="mr-2 h-4 w-4" />
                  Coverage
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {testResults.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No test results yet. Run tests to see results.
                      </p>
                    ) : (
                      testResults.map((result, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(result.status)}
                              <div>
                                <p className="font-medium">{result.test}</p>
                                <p className="text-sm text-muted-foreground">{result.suite}</p>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {result.duration}ms
                            </span>
                          </div>
                          {result.error && (
                            <Alert className="mt-2 border-destructive">
                              <AlertDescription className="text-xs font-mono">
                                {result.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="output" className="mt-4">
                <ScrollArea className="h-[400px] bg-background text-muted-foreground p-4 rounded-lg">
                  <pre className="text-xs font-mono">
                    {output.length === 0 ? (
                      <span className="text-muted-foreground">No output yet...</span>
                    ) : (
                      output.join('\n')
                    )}
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="coverage" className="mt-4">
                {coverage ? (
                  <div className="space-y-4">
                    {Object.entries(coverage).map(([type, data]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">{type}</span>
                          <span className={`font-bold ${getCoverageColor(data.percentage)}`}>
                            {data.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              data.percentage >= 80
                                ? 'bg-green-500'
                                : data.percentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-destructive/10'
                            }`}
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {data.covered} / {data.total} covered
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No coverage data available. Run tests with coverage to see results.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
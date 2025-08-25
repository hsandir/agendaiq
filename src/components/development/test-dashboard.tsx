'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import AutofixModal from './autofix-modal'
import { 
  PlayIcon, 
  SquareIcon, 
  RefreshCwIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  FileTextIcon,
  BarChart2Icon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Loader2Icon,
  TestTube2Icon,
  WrenchIcon
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
  category: 'unit' | 'integration' | 'e2e' | 'performance';
}

interface TestResult {
  suite: string
  test: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
  file?: string
  line?: number;
;}

interface CoverageReport {
  statements: { total: number; covered: number; percentage: number ;}
  branches: { total: number; covered: number; percentage: number ;}
  functions: { total: number; covered: number; percentage: number ;}
  lines: { total: number; covered: number; percentage: number ;}
  files?: {
    [key: string]: {
      statements: { total: number; covered: number; percentage: number ;}
      branches: { total: number; covered: number; percentage: number ;}
      functions: { total: number; covered: number; percentage: number ;}
      lines: { total: number; covered: number; percentage: number ;}
      uncoveredLines?: number[]
    }
  }
}

interface TestHistory {
  date: string
  passed: number
  failed: number
  coverage: number
  duration: number
;}

export default function TestDashboard() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [coverage, setCoverage] = useState<CoverageReport | null>(null)
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [testHistory, setTestHistory] = useState<TestHistory[]>([])
  const [untestedFiles, setUntestedFiles] = useState<{ components: string[], apis: string[] ;}>({ components: [], apis: [] ;})
  const [activeTab, setActiveTab] = useState('results');
  const [showAutofixModal, setShowAutofixModal] = useState(false);
  useEffect(() => {
    loadTestSuites();
    loadTestHistory();
    loadUntestedFiles();
  }, [])

  const loadTestSuites = async () => {
    try {
      const response = await fetch('/api/tests/suites');
      const data = await response.json();
      setTestSuites(data.suites ?? []);
    } catch (error: unknown) {
      console.error('Failed to load test suites:', error);
    }
  }

  const loadTestHistory = async () => {
    try {
      const response = await fetch('/api/tests/history');
      if (!response.ok) throw new Error('Failed to fetch test history');
      const data = await response.json();
      setTestHistory(data.history ?? []);
    } catch (error: unknown) {
      console.error('Failed to load test history:', error);
      setTestHistory([]);
    }
  }

  const loadUntestedFiles = async () => {
    try {
      const response = await fetch('/api/tests/generate');
      const data = await response.json();
      setUntestedFiles(data.untested || { components: [], apis: [] ;});
    } catch (error: unknown) {
      console.error('Failed to load untested files:', error);
    }
  }

  const runTests = async (suitePath?: string, options: { coverage?: boolean, watch?: boolean } = {}) => {
    setIsRunning(true);
    setOutput([]);
    setTestResults([]);
    try {
      const response = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          suite: suitePath,
          coverage: options.coverage,
          watch: options.watch
        ;})
      })
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to run tests');
      }
      
      // Handle regular JSON response (non-streaming)
      const data = await response.json();
      // Update output with test results
      if (data.output && Array.isArray(data.output)) {
        setOutput(data.output);
      }
      
      // Parse test results
      if (data.testResults && Array.isArray(data.testResults)) {
        const results: TestResult[] = []
        data.testResults.forEach((suite: any) => {
          if (suite.tests && Array.isArray(suite.tests)) {
            suite.tests.forEach((test: any) => {
              results.push({
                suite: suite.name || 'Unknown Suite',
                test: test.title || test.fullName || 'Unknown Test',
                status: test.status as 'passed' | 'failed' | 'skipped',
                duration: test.duration || 0,
                error: test.failureMessages ? test.failureMessages.join('\n') : undefined,
                file: suite.name,
                line: 0
              ;})
            })
          }
        })
        setTestResults(results);
      }
      
      // Update coverage if available
      if (data.coverage) {
        setCoverage(data.coverage);
      }
      
      // Update suite status
      if (suitePath && data.success !== undefined) {
        setTestSuites(prev => prev.map(suite => {
          if (suite.path === suitePath || suite.files?.includes(suitePath)) {
            return {
              ...suite,
              status: data.success ? 'passed' : 'failed',
              passed: data.results?.passed || 0,
              failed: data.results?.failed || 0,
              skipped: data.results?.skipped || 0,
              duration: data.results?.duration || 0
            ;}
          }
          return suite
        }))
      }
      
    } catch (error: unknown) {
      console.error('Test run failed:', error);
      setOutput(prev => [...prev, `Error: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  }

  const generateTest = async (filePath: string) => {
    try {
      const response = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      })
      
      const data = await response.json();
      if (data.success) {
        await loadTestSuites();
        await loadUntestedFiles();
      }
    } catch (error: unknown) {
      console.error('Failed to generate test:', error);
    }
  }

  const exportReport = () => {
    // Generate and download test report
    const report = {
      date: new Date().toISOString(),
      suites: testSuites,
      results: testResults,
      coverage,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'passed').length,
        failed: testResults.filter(r => r.status === 'failed').length,
        skipped: testResults.filter(r => r.status === 'skipped').length,
      }
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' ;})
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.json`
    a.click();
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-destructive" />
      case 'running':
        return <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
      default:
        return <ClockIcon className="h-4 w-4 text-muted-foreground" />
    ;}
  }

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-destructive'
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'unit': return 'default'
      case 'integration': return 'secondary'
      case 'e2e': return 'outline'
      case 'performance': return 'destructive'
      default: return 'default'
    ;}
  }

  const filteredSuites = testSuites.filter(suite => {
    const matchesFilter = suite.name.toLowerCase().includes(filter.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || suite.category === categoryFilter
    return matchesFilter && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Test Runner</CardTitle>
              <CardDescription>Run and manage your test suites</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => runTests(undefined, { coverage: true ;})}
                disabled={isRunning}
                variant="default"
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
              <Button
                variant="outline"
                onClick={exportReport}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search test suites..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <FilterIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="unit">Unit Tests</SelectItem>
                <SelectItem value="integration">Integration Tests</SelectItem>
                <SelectItem value="e2e">E2E Tests</SelectItem>
                <SelectItem value="performance">Performance Tests</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Suites */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Test Suites</CardTitle>
            <CardDescription>{filteredSuites.length} suites found</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-2">
                {filteredSuites.map((suite) => (
                  <div
                    key={suite.path}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSuite === suite.path
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'hover:bg-muted hover:shadow-sm'
                    ;}`}
                    onClick={() => setSelectedSuite(suite.path)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(suite.status)}
                        <span className="font-medium text-sm">{suite.name}</span>
                      </div>
                      <Badge variant={getCategoryBadgeVariant(suite.category)} className="text-xs">
                        {suite.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{suite.tests} tests</span>
                      {suite.duration && <span>{suite.duration}ms</span>}
                    </div>
                    {suite.passed !== undefined && (
                      <div className="mt-2">
                        <Progress 
                          value={(suite.passed / suite.tests) * 100} 
                          className="h-1"
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-green-600">{suite.passed} passed</span>
                          {suite.failed && suite.failed > 0 && <span className="text-destructive">{suite.failed} failed</span>;}
                        </div>
                      </div>
                    );}
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        runTests(suite.path);
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

        {/* Results and Analytics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Results & Analytics</CardTitle>
              {testResults.some(r => r.status === 'failed') && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowAutofixModal(true)}
                >
                  <WrenchIcon className="h-4 w-4 mr-2" />
                  Fix the Errors
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="untested">Untested</TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="mt-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {testResults.length === 0 ? (
                      <div className="text-center py-8">
                        <TestTube2Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No test results yet</p>
                        <p className="text-sm text-muted-foreground">Run tests to see results</p>
                      </div>
                    ) : (
                      testResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 border rounded-lg ${
                            result.status === 'failed' ? 'border-destructive bg-destructive/10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(result.status)}
                              <div>
                                <p className="font-medium text-sm">{result.test}</p>
                                <p className="text-xs text-muted-foreground">{result.suite}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground">
                                {result.duration}ms
                              </span>
                              {result.file && (
                                <p className="text-xs text-primary cursor-pointer hover:underline">
                                  {result.file}:{result.line}
                                </p>
                              )}
                            </div>
                          </div>
                          {result.error && (
                            <Alert className="mt-2 border-destructive bg-destructive/10">
                              <AlertCircleIcon className="h-4 w-4" />
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

              <TabsContent value="coverage" className="mt-4">
                {coverage ? (
                  <div className="space-y-6">
                    {/* Overall Coverage */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(coverage).filter(([key]) => key !== 'files').map(([type, data]) => (
                        <Card key={type}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium capitalize">{type}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${getCoverageColor(data.percentage)}`}>
                              {data.percentage.toFixed(1)}%
                            </div>
                            <Progress value={data.percentage} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {data.covered} / {data.total}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* File Coverage */}
                    {coverage.files && (
                      <div>
                        <h3 className="font-medium mb-2">File Coverage</h3>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {Object.entries(coverage.files).map(([file, data]) => (
                              <div key={file} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-mono">{file}</span>
                                  <span className={`font-bold ${getCoverageColor(data.lines.percentage)}`}>
                                    {data.lines.percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress value={data.lines.percentage} className="mt-2 h-1" />
                                {data.uncoveredLines && data.uncoveredLines.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Uncovered lines: {data.uncoveredLines.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart2Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No coverage data available</p>
                    <p className="text-sm text-muted-foreground">Run tests with coverage to see results</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="output" className="mt-4">
                <ScrollArea className="h-[500px] bg-background text-muted-foreground p-4 rounded-lg">
                  <pre className="text-xs font-mono">
                    {output.length === 0 ? (
                      <span className="text-muted-foreground">No output yet...</span>
                    ) : (
                      output.join('\n');
                    )}
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Test Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <TrendingUpIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm">+5 tests this week</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Coverage Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <TrendingUpIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm">+4.0% this week</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Recent Test Runs</h3>
                    <div className="space-y-2">
                      {testHistory
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10);
                        .map((run, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{run.date}</p>
                              <p className="text-xs text-muted-foreground">
                                {run.passed} passed, {run.failed} failed
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{run.coverage}%</p>
                              <p className="text-xs text-muted-foreground">{run.duration}s</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="untested" className="mt-4">
                <div className="space-y-4">
                  <Alert>
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>
                      {untestedFiles.components.length + untestedFiles.apis.length} files without tests
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="font-medium mb-2">Components ({untestedFiles.components.length})</h3>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {untestedFiles.components.map((file) => (
                          <div key={file} className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm font-mono">{file}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateTest(file)}
                            >
                              Generate Test
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">API Routes ({untestedFiles.apis.length})</h3>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {untestedFiles.apis.map((file) => (
                          <div key={file} className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm font-mono">{file}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateTest(file)}
                            >
                              Generate Test
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Autofix Modal */}
      <AutofixModal
        isOpen={showAutofixModal}
        onClose={() => setShowAutofixModal(false)}
        type="test"
        failedItems={testResults.filter(r => r.status === 'failed')}
      />
    </div>
  )
}
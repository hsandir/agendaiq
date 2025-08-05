import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { spawn } from 'child_process'
import { Logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAdminRole: true })
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
  }

  const user = authResult.user!

  try {
    const { suite, coverage = false } = await request.json()

    // Create a stream response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendMessage = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
        }

        // Determine the test command
        const args = ['test']
        if (suite) {
          args.push(suite)
        }
        if (coverage) {
          args.push('--', '--coverage')
        }
        args.push('--', '--json', '--outputFile=/tmp/test-results.json')

        // Spawn the test process
        const testProcess = spawn('npm', args, {
          cwd: process.cwd(),
          env: { ...process.env, CI: 'true' }
        })

        let outputBuffer = ''

        testProcess.stdout.on('data', (data) => {
          const output = data.toString()
          outputBuffer += output

          // Try to parse JSON output from Jest
          const lines = outputBuffer.split('\n')
          outputBuffer = lines[lines.length - 1] // Keep incomplete line

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim()
            if (!line) continue

            try {
              const jsonData = JSON.parse(line)
              
              // Handle different Jest reporter events
              if (jsonData.testResults) {
                jsonData.testResults.forEach((result: any) => {
                  sendMessage({
                    type: 'suite-update',
                    suite: {
                      path: result.testFilePath,
                      status: result.numFailingTests > 0 ? 'failed' : 'passed',
                      passed: result.numPassingTests,
                      failed: result.numFailingTests,
                      duration: result.perfStats.runtime
                    }
                  })

                  result.testResults.forEach((test: any) => {
                    sendMessage({
                      type: 'result',
                      result: {
                        suite: result.testFilePath,
                        test: test.title,
                        status: test.status,
                        duration: test.duration || 0,
                        error: test.failureMessages?.join('\n')
                      }
                    })
                  })
                })
              }

              if (jsonData.coverageMap) {
                const coverage = calculateCoverage(jsonData.coverageMap)
                sendMessage({ type: 'coverage', coverage })
              }
            } catch (e) {
              // Not JSON, send as regular output
              sendMessage({ type: 'output', message: line })
            }
          }
        })

        testProcess.stderr.on('data', (data) => {
          sendMessage({ type: 'output', message: data.toString() })
        })

        testProcess.on('close', (code) => {
          sendMessage({ 
            type: 'complete', 
            success: code === 0,
            message: code === 0 ? 'Tests completed successfully' : 'Tests failed'
          })
          controller.close()
        })

        testProcess.on('error', (error) => {
          sendMessage({ type: 'error', message: error.message })
          controller.close()
        })
      }
    })

    await Logger.audit('TEST_RUN', user.id, { suite, coverage }, 'testing')

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    await Logger.error('Failed to run tests', { error: String(error) }, 'testing')
    return NextResponse.json(
      { error: 'Failed to run tests' },
      { status: 500 }
    )
  }
}

function calculateCoverage(coverageMap: any) {
  const totals = {
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    lines: { total: 0, covered: 0 }
  }

  Object.values(coverageMap).forEach((fileCoverage: any) => {
    ['statements', 'branches', 'functions', 'lines'].forEach(type => {
      const summary = fileCoverage[type]
      if (summary) {
        totals[type as keyof typeof totals].total += summary.total
        totals[type as keyof typeof totals].covered += summary.covered
      }
    })
  })

  return Object.entries(totals).reduce((acc, [type, data]) => {
    acc[type as keyof typeof totals] = {
      ...data,
      percentage: data.total > 0 ? (data.covered / data.total) * 100 : 0
    }
    return acc
  }, {} as any)
}
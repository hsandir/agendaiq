import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { glob } from 'glob'
import path from 'path'
import fs from 'fs/promises'

export async function GET(request: NextRequest) {
  // Development endpoint - no auth required
  console.log('Test suites API called')

  try {
    // Find all test files
    const testFiles = await glob('src/**/*.test.{ts,tsx,js,jsx}', {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**']
    })

    // Group tests by category
    const suites = await Promise.all(
      testFiles.map(async (file) => {
        const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8')
        const testCount = (content.match(/\bit\s*\(/g) || []).length
        const describeMatches = content.match(/describe\s*\(\s*['"`]([^'"`]+)['"`]/g) || []
        const suiteName = describeMatches.length > 0 && describeMatches[0]
          ? describeMatches[0].replace(/describe\s*\(\s*['"`]([^'"`]+)['"`]/, '$1')
          : path.basename(file, path.extname(file))

        return {
          name: suiteName,
          path: file,
          tests: testCount,
          status: 'idle' as const,
          category: file.includes('unit') ? 'unit' : 
                   file.includes('integration') ? 'integration' : 
                   file.includes('e2e') ? 'e2e' : 'other'
        }
      })
    )

    // Return real test suites only
    if (false) { // Disabled simulation
      const simulatedSuites = [
        {
          path: 'src/components/auth/__tests__',
          name: 'Authentication Components',
          tests: 15,
          passed: 14,
          failed: 1,
          duration: 1234,
          lastRun: new Date(Date.now() - 3600000).toISOString(),
          status: 'failed' as const,
          category: 'unit' as const
        },
        {
          path: 'src/components/dashboard/__tests__',
          name: 'Dashboard Components',
          tests: 22,
          passed: 22,
          failed: 0,
          duration: 2156,
          lastRun: new Date(Date.now() - 7200000).toISOString(),
          status: 'passed' as const,
          category: 'unit' as const
        },
        {
          path: 'src/app/api/__tests__',
          name: 'API Routes',
          tests: 45,
          passed: 43,
          failed: 2,
          duration: 3421,
          lastRun: new Date(Date.now() - 1800000).toISOString(),
          status: 'failed' as const,
          category: 'integration' as const
        },
        {
          path: 'src/lib/auth/__tests__',
          name: 'Auth Utilities',
          tests: 18,
          passed: 18,
          failed: 0,
          duration: 876,
          lastRun: new Date(Date.now() - 5400000).toISOString(),
          status: 'passed' as const,
          category: 'unit' as const
        },
        {
          path: 'src/lib/utils/__tests__',
          name: 'Utility Functions',
          tests: 32,
          passed: 32,
          failed: 0,
          duration: 543,
          lastRun: new Date(Date.now() - 10800000).toISOString(),
          status: 'passed' as const,
          category: 'unit' as const
        },
        {
          path: 'e2e/__tests__',
          name: 'End-to-End Tests',
          tests: 8,
          passed: 7,
          failed: 1,
          duration: 12543,
          lastRun: new Date(Date.now() - 86400000).toISOString(),
          status: 'failed' as const,
          category: 'e2e' as const
        },
        {
          path: 'src/performance/__tests__',
          name: 'Performance Tests',
          tests: 5,
          passed: 5,
          failed: 0,
          duration: 8765,
          lastRun: new Date(Date.now() - 172800000).toISOString(),
          status: 'passed' as const,
          category: 'performance' as const
        }
      ];
      
      return NextResponse.json({ suites: simulatedSuites });
    }
    
    return NextResponse.json({ 
      suites: suites.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    })
  } catch (error) {
    console.error('Failed to load test suites:', error)
    return NextResponse.json(
      { error: 'Failed to load test suites' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { glob } from 'glob'
import path from 'path'
import fs from 'fs/promises'

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAdminRole: true })
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
  }

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
        const suiteName = describeMatches.length > 0 
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
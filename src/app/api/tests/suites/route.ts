import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    // Get list of test files from Jest
    const { stdout } = await execAsync('npm test -- --listTests', {
      cwd: process.cwd(),
      env: { ...process.env, CI: 'true' }
    });

    // Parse test files from output
    const testFiles = stdout
      .split('\n')
      .filter(line => line.trim() && line.includes('__tests__'))
      .map(filePath => filePath.trim());

    // Group tests by category
    const suiteMap = new Map();
    
    for (const filePath of testFiles) {
      // Determine category based on path
      let category = 'unit';
      let suiteName = 'Unit Tests';
      
      if (filePath.includes('integration')) {
        category = 'integration';
        suiteName = 'Integration Tests';
      } else if (filePath.includes('e2e')) {
        category = 'e2e';
        suiteName = 'E2E Tests';
      } else if (filePath.includes('performance')) {
        category = 'performance';
        suiteName = 'Performance Tests';
      } else if (filePath.includes('security')) {
        category = 'security';
        suiteName = 'Security Tests';
      } else if (filePath.includes('api')) {
        category = 'api';
        suiteName = 'API Tests';
      } else if (filePath.includes('components')) {
        category = 'component';
        suiteName = 'Component Tests';
      } else if (filePath.includes('utils')) {
        category = 'utils';
        suiteName = 'Utility Tests';
      } else if (filePath.includes('middleware')) {
        category = 'middleware';
        suiteName = 'Middleware Tests';
      } else if (filePath.includes('auth')) {
        category = 'auth';
        suiteName = 'Auth Tests';
      } else if (filePath.includes('theme')) {
        category = 'theme';
        suiteName = 'Theme Tests';
      }

      // Extract relative path
      const relativePath = filePath.replace(process.cwd() + '/', '');
      const dirPath = path.dirname(relativePath);
      
      // Create a unique key for grouping
      const key = `${category}-${dirPath}`;
      
      if (!suiteMap.has(key)) {
        suiteMap.set(key, {
          name: suiteName,
          path: dirPath,
          category,
          tests: 0,
          files: [],
          status: 'idle',
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0
        });
      }
      
      const suite = suiteMap.get(key);
      suite.tests++;
      suite.files.push(relativePath);
    }

    // Try to read last test results if available
    try {
      const resultsPath = path.join(process.cwd(), 'test-results.json');
      const resultsContent = await fs.readFile(resultsPath, 'utf-8');
      const lastResults = JSON.parse(resultsContent);
      
      // Update suite stats from last run
      if (lastResults.testResults) {
        for (const testResult of lastResults.testResults) {
          const testPath = testResult.name.replace(process.cwd() + '/', '');
          const dirPath = path.dirname(testPath);
          
          // Find matching suite
          for (const [key, suite] of suiteMap.entries()) {
            if (suite.files.includes(testPath)) {
              suite.passed += testResult.numPassingTests || 0;
              suite.failed += testResult.numFailingTests || 0;
              suite.skipped += testResult.numPendingTests || 0;
              suite.duration += testResult.perfStats?.runtime || 0;
              suite.status = testResult.numFailingTests > 0 ? 'failed' : 'passed';
            }
          }
        }
      }
    } catch (e) {
      // No previous results available, that's fine
    }

    const suites = Array.from(suiteMap.values());

    return NextResponse.json({ 
      success: true,
      suites,
      total: suites.length,
      totalTests: testFiles.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error discovering test suites:', error);
    
    // Return empty array if Jest is not configured or no tests found
    return NextResponse.json({ 
      success: false,
      suites: [],
      total: 0,
      totalTests: 0,
      error: error instanceof Error ? error.message : 'Failed to discover test suites',
      timestamp: new Date().toISOString()
    });
  }
}

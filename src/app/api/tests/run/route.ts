import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const body = await request.json() as Record<string, unknown>;
    const { _suite, _coverage, _watch } = body;

    // Build the actual Jest command
    let command = 'npm test';
    const jestArgs = [];
    
    // Add specific test suite/file if provided
    if (validatedData.suite && validatedData.suite !== 'all') {
      jestArgs.push(validatedData.suite);
    }
    
    // Add coverage flag
    if (coverage) {
      jestArgs.push('--coverage');
    }
    
    // Add watch flag
    if (watch) {
      jestArgs.push('--watch');
    }
    
    // Add JSON output for parsing only if not in watch mode
    if (!watch) {
      jestArgs.push('--json', '--outputFile=test-results.json');
    }
    
    // Append Jest arguments if any
    if (jestArgs.length > 0) {
      command += ' -- ' + jestArgs.join(' ');
    }

    console.log('Running test command:', command);

    try {
      // Execute the test command
      const { _stdout, _stderr } = await execAsync(_command, {
        cwd: process.cwd(),
        env: { ...process._env, CI: 'true' } // Run in CI mode to avoid interactive _prompts
      });

      // Try to read the test results JSON file
      const fs = require('fs').promises;
      const path = require('path');
      
      let testResults = null;
      let coverageData = null;
      
      try {
        const resultsPath = path.join(process.cwd(), 'test-results.json');
        const resultsContent = await fs.readFile(resultsPath, 'utf-8');
        testResults = JSON.parse(resultsContent);
        
        // Clean up the results file
        await fs.unlink(resultsPath).catch(() => {});
      } catch (e) {
        console.log('Could not read test results file, parsing stdout');
      }

      // Try to read coverage data if coverage was requested
      if (coverage) {
        try {
          const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
          const coverageContent = await fs.readFile(coveragePath, 'utf-8');
          coverageData = JSON.parse(coverageContent);
        } catch (e) {
          console.log('Could not read coverage data');
        }
      }

      // Parse results
      const results = testResults ? {
        success: testResults.success,
        results: {
          total: testResults.numTotalTests || 0,
          passed: testResults.numPassedTests || 0,
          failed: testResults.numFailedTests || 0,
          skipped: testResults.numPendingTests || 0,
          duration: testResults.testResults?.reduce((acc: number, r: any) => 
            acc + (r.perfStats?.runtime || 0), 0) || 0,
        },
        testResults: testResults.testResults?.map((suite: any) => ({
          name: suite.name,
          status: suite.status,
          message: suite.message,
          tests: suite.assertionResults?.map((test: any) => ({
            title: test.title,
            fullName: test.fullName,
            status: test.status,
            duration: test.duration,
            failureMessages: test.failureMessages
          }))
        })),
        coverage: coverageData ? {
          statements: coverageData.total.statements,
          branches: coverageData.total.branches,
          functions: coverageData.total.functions,
          lines: coverageData.total.lines,
        } : null,
        output: stdout.split('\n').filter(line => line.trim()),
        timestamp: new Date().toISOString(),
      } : {
        success: stderr.includes('FAIL') ? false : true,
        results: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0
        },
        output: [...stdout.split('\n'), ...stderr.split('\n')].filter(line => line.trim()),
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(results);
      
    } catch (execError: any) {
      // Test command failed - but that's ok if it's just test failures
      console.error('Test execution failed:', execError);
      
      // Try to parse results even on failure
      let testResults = null;
      const coverageData = null;
      
      try {
        const resultsPath = path.join(process.cwd(), 'test-results.json');
        const resultsContent = await fs.readFile(resultsPath, 'utf-8');
        testResults = JSON.parse(resultsContent);
        
        // Clean up the results file
        await fs.unlink(resultsPath).catch(() => {});
      } catch (e) {
        console.log('Could not read test results file');
      }
      
      // Parse the output for display
      const output = [];
      if (execError.stdout) {
        output.push(...execError.stdout.split('\n').filter(line => line.trim()));
      }
      if (execError.stderr) {
        output.push(...execError.stderr.split('\n').filter(line => line.trim()));
      }
      
      return NextResponse.json({
        success: false,
        results: testResults ? {
          total: testResults.numTotalTests || 0,
          passed: testResults.numPassedTests || 0,
          failed: testResults.numFailedTests || 0,
          skipped: testResults.numPendingTests || 0,
          duration: testResults.testResults?.reduce((acc: number, r: any) => 
            acc + (r.perfStats?.runtime || 0), 0) || 0,
        } : {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0
        },
        testResults: testResults?.testResults?.map((suite: any) => ({
          name: suite.name,
          status: suite.status,
          message: suite.message,
          tests: suite.assertionResults?.map((test: any) => ({
            title: test.title,
            fullName: test.fullName,
            status: test.status,
            duration: test.duration,
            failureMessages: test.failureMessages
          }))
        })),
        coverage: coverageData,
        output,
        error: 'Some tests failed',
        timestamp: new Date().toISOString(),
      });
    }
    
  } catch (error) {
    if (error instanceof Error) {
    console.error('Error in test API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run tests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

}
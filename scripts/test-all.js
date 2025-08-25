#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

// Test configurations
const testSuites = [
  {
    name: 'Type Check',
    command: 'npm run type-check',
    critical: true,
  },
  {
    name: 'Linting',
    command: 'npm run lint',
    critical: false,
  },
  {
    name: 'Unit Tests - Components',
    command: 'npm test -- src/__tests__/unit/components --coverage',
    critical: true,
  },
  {
    name: 'Unit Tests - API',
    command: 'npm test -- src/__tests__/unit/api --coverage',
    critical: true,
  },
  {
    name: 'Unit Tests - Utils',
    command: 'npm test -- src/__tests__/unit/utils --coverage',
    critical: true,
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    critical: false,
  },
  {
    name: 'Meeting Components Tests',
    command: 'npm test -- --testNamePattern="Meeting|Repeat" --coverage',
    critical: true,
  },
];

const results = [];
let hasFailures = false;
let hasCriticalFailures = false;

function runTest(suite, index) {
  return new Promise((resolve) => {
    logSection(`[${index + 1}/${testSuites.length}] Running: ${suite.name}`);
    
    const startTime = Date.now();
    
    exec(suite.command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (error) {
        log(`✗ ${suite.name} failed (${duration}s)`, colors.red);
        if (suite.critical) {
          log('  CRITICAL TEST FAILURE', colors.bright + colors.red);
          hasCriticalFailures = true;
        }
        hasFailures = true;
        
        // Log error details
        if (stderr) {
          console.log(colors.yellow + 'Errors:' + colors.reset);
          console.log(stderr);
        }
        if (stdout && stdout.includes('FAIL')) {
          console.log(colors.yellow + 'Failed tests:' + colors.reset);
          const failedTests = stdout.split('\n').filter(line => 
            line.includes('FAIL') || line.includes('✕')
          );
          failedTests.forEach(line => console.log('  ' + line));
        }
        
        results.push({
          name: suite.name,
          status: 'FAILED',
          duration,
          critical: suite.critical,
          error: error.message,
        });
      } else {
        log(`✓ ${suite.name} passed (${duration}s)`, colors.green);
        
        // Extract coverage info if available
        const coverageMatch = stdout.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|([\d.]+)/);
        const coverage = coverageMatch ? coverageMatch[1] : null;
        
        results.push({
          name: suite.name,
          status: 'PASSED',
          duration,
          coverage,
        });
        
        if (coverage) {
          log(`  Coverage: ${coverage}%`, colors.cyan);
        }
      }
      
      resolve();
    });
  });
}

async function runAllTests() {
  log('\n🧪 Starting Comprehensive Test Suite', colors.bright + colors.magenta);
  log(`Running ${testSuites.length} test suites...`, colors.cyan);
  
  const startTime = Date.now();
  
  // Run tests sequentially
  for (let i = 0; i < testSuites.length; i++) {
    await runTest(testSuites[i], i);
  }
  
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Print summary
  logSection('📊 Test Results Summary');
  
  console.log('\n' + colors.bright + 'Results by Suite:' + colors.reset);
  results.forEach(result => {
    const statusColor = result.status === 'PASSED' ? colors.green : colors.red;
    const criticalTag = result.critical ? ' [CRITICAL]' : '';
    const coverageInfo = result.coverage ? ` (Coverage: ${result.coverage}%)` : '';
    console.log(`  ${statusColor}${result.status === 'PASSED' ? '✓' : '✗'} ${result.name}${criticalTag}: ${result.duration}s${coverageInfo}${colors.reset}`);
  });
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log('\n' + colors.bright + 'Summary:' + colors.reset);
  console.log(`  Total: ${results.length}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`  Duration: ${totalDuration}s`);
  
  if (hasCriticalFailures) {
    log('\n❌ CRITICAL TESTS FAILED - Build should not proceed!', colors.bright + colors.red);
    process.exit(1);
  } else if (hasFailures) {
    log('\n⚠️  Some tests failed, but no critical failures', colors.yellow);
    process.exit(0);
  } else {
    log('\n✅ All tests passed successfully!', colors.bright + colors.green);
    process.exit(0);
  }
}

// Check if specific test pattern is provided
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
${colors.bright}Test Runner Script${colors.reset}

Usage: node scripts/test-all.js [options]

Options:
  --help          Show this help message
  --quick         Run only critical tests
  --coverage      Generate full coverage report
  --watch         Run tests in watch mode

Examples:
  node scripts/test-all.js
  node scripts/test-all.js --quick
  node scripts/test-all.js --coverage
  `);
  process.exit(0);
}

if (args.includes('--quick')) {
  // Filter only critical tests
  testSuites.splice(0, testSuites.length, ...testSuites.filter(s => s.critical));
  log('Running quick test suite (critical tests only)', colors.yellow);
}

if (args.includes('--coverage')) {
  // Add coverage report generation
  testSuites.push({
    name: 'Generate Coverage Report',
    command: 'npm run test:coverage',
    critical: false,
  });
}

// Run the tests
runAllTests().catch(error => {
  log('Unexpected error running tests:', colors.red);
  console.error(error);
  process.exit(1);
});
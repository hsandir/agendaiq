#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n🧪 AgendaIQ Comprehensive Test Suite\n'));

const testSuites = [
  {
    name: 'Unit Tests',
    command: 'npm',
    args: ['run', 'test:unit'],
    description: 'Testing individual components and functions'
  },
  {
    name: 'Integration Tests',
    command: 'npm',
    args: ['run', 'test:integration'],
    description: 'Testing API endpoints and database operations'
  },
  {
    name: 'E2E Tests',
    command: 'npm',
    args: ['run', 'test:e2e'],
    description: 'Testing complete user workflows'
  },
  {
    name: 'Security Tests',
    command: 'npm',
    args: ['run', 'test:security'],
    description: 'Testing authentication and security measures'
  },
  {
    name: 'Performance Tests',
    command: 'npm',
    args: ['run', 'test:performance'],
    description: 'Testing load times and response speeds'
  }
];

async function runTest(suite) {
  console.log(chalk.yellow(`\n📋 Running ${suite.name}...`));
  console.log(chalk.gray(`   ${suite.description}`));
  
  return new Promise((resolve) => {
    const process = spawn(suite.command, suite.args, {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${suite.name} passed`));
        resolve(true);
      } else {
        console.log(chalk.red(`❌ ${suite.name} failed with code ${code}`));
        resolve(false);
      }
    });

    process.on('error', (err) => {
      console.log(chalk.red(`❌ ${suite.name} error: ${err.message}`));
      resolve(false);
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const suite of testSuites) {
    const passed = await runTest(suite);
    results.push({ name: suite.name, passed });
  }

  console.log(chalk.blue.bold('\n📊 Test Results Summary\n'));
  
  let allPassed = true;
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? chalk.green : chalk.red;
    console.log(color(`${icon} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`));
    if (!result.passed) allPassed = false;
  });

  if (allPassed) {
    console.log(chalk.green.bold('\n🎉 All tests passed successfully!\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('\n⚠️ Some tests failed. Please review the output above.\n'));
    process.exit(1);
  }
}

// Check if specific test suite is requested
const requestedSuite = process.argv[2];
if (requestedSuite) {
  const suite = testSuites.find(s => s.name.toLowerCase().includes(requestedSuite.toLowerCase()));
  if (suite) {
    runTest(suite).then(passed => {
      process.exit(passed ? 0 : 1);
    });
  } else {
    console.log(chalk.red(`Unknown test suite: ${requestedSuite}`));
    console.log(chalk.gray('Available suites: unit, integration, e2e, security, performance'));
    process.exit(1);
  }
} else {
  runAllTests();
}
#!/usr/bin/env node

/**
 * Comprehensive Local Testing Suite for AgendaIQ
 * Tests all critical endpoints, pages, and functionality locally
 */

const LOCAL_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

async function testEndpoint(url, name, options = {}) {
  const { 
    method = 'GET', 
    headers = {}, 
    body = null,
    expectedStatus = 200,
    validateResponse = null,
    critical = false
  } = options;

  try {
    const fetchOptions = { method, headers };
    if (body) {
      fetchOptions.body = JSON.stringify(body);
      fetchOptions.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    let data = null;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // Response is not JSON
      data = responseText;
    }

    const success = response.status === expectedStatus;
    
    if (success) {
      if (validateResponse && !validateResponse(data)) {
        testResults.warnings.push({ name, issue: 'Response validation failed', data });
        log(`  ⚠️ ${name}: Status OK but validation failed`, 'yellow');
        return false;
      }
      testResults.passed.push({ name, status: response.status });
      log(`  ✅ ${name}: ${response.status}`, 'green');
      return true;
    } else {
      testResults.failed.push({ 
        name, 
        status: response.status, 
        expected: expectedStatus, 
        error: data,
        critical 
      });
      log(`  ❌ ${name}: ${response.status} (expected ${expectedStatus})`, 'red');
      if (data && typeof data === 'object') {
        log(`     Error: ${JSON.stringify(data).substring(0, 100)}`, 'red');
      }
      return false;
    }
  } catch (error) {
    testResults.failed.push({ 
      name, 
      error: error.message,
      critical 
    });
    log(`  ❌ ${name}: Network error - ${error.message}`, 'red');
    return false;
  }
}

async function testPage(path, name, options = {}) {
  const { checkForText = [], checkNotPresent = [] } = options;
  
  try {
    const response = await fetch(`${LOCAL_URL}${path}`);
    const html = await response.text();
    
    if (response.ok) {
      let issues = [];
      
      // Check for required text
      for (const text of checkForText) {
        if (!html.includes(text)) {
          issues.push(`Missing: "${text}"`);
        }
      }
      
      // Check for text that should NOT be present
      for (const text of checkNotPresent) {
        if (html.includes(text)) {
          issues.push(`Should not contain: "${text}"`);
        }
      }
      
      if (issues.length > 0) {
        testResults.warnings.push({ name, issues });
        log(`  ⚠️ ${name}: Page loads but has issues`, 'yellow');
        issues.forEach(issue => log(`     - ${issue}`, 'yellow'));
        return false;
      }
      
      testResults.passed.push({ name, status: response.status });
      log(`  ✅ ${name}: ${response.status}`, 'green');
      return true;
    } else {
      testResults.failed.push({ name, status: response.status });
      log(`  ❌ ${name}: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    testResults.failed.push({ name, error: error.message });
    log(`  ❌ ${name}: ${error.message}`, 'red');
    return false;
  }
}

async function checkServerRunning() {
  try {
    const response = await fetch(LOCAL_URL);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function runComprehensiveTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔍 COMPREHENSIVE LOCAL TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`URL: ${LOCAL_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  // Check if server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    log('❌ Server is not running at http://localhost:3000', 'red');
    log('Please start the server with: npm run dev', 'yellow');
    process.exit(1);
  }

  // 1. CRITICAL INFRASTRUCTURE TESTS
  log('1️⃣ CRITICAL INFRASTRUCTURE', 'yellow');
  
  // Test with API key from environment (for local testing)
  const monitoringApiKey = process.env.MONITORING_API_KEY || '45c1369b5c6a8f9ef338065e5845c45d0cdf68ab07e39bbeb089e01b12c46f66';
  
  await testEndpoint(
    `${LOCAL_URL}/api/monitoring/uptime`,
    'Uptime Check (With API Key)',
    { 
      critical: true,
      headers: {
        'Authorization': `Bearer ${monitoringApiKey}`
      },
      validateResponse: (data) => data.status === 'healthy' || data.status === 'degraded' || data.status === 'ok'
    }
  );
  
  await testEndpoint(
    `${LOCAL_URL}/api/auth/csrf`,
    'CSRF Token Generation',
    { 
      critical: true,
      validateResponse: (data) => data.csrfToken && data.csrfToken.length > 0
    }
  );
  
  await testEndpoint(
    `${LOCAL_URL}/api/auth/providers`,
    'Auth Providers',
    { 
      critical: true,
      validateResponse: (data) => data.credentials !== undefined
    }
  );

  // 2. AUTHENTICATION ENDPOINTS
  log('\n2️⃣ AUTHENTICATION SYSTEM', 'yellow');
  
  await testEndpoint(
    `${LOCAL_URL}/api/auth/check-first-user`,
    'First User Check',
    { 
      validateResponse: (data) => typeof data === 'boolean'
    }
  );
  
  await testEndpoint(
    `${LOCAL_URL}/api/auth/session`,
    'Session Check (No Auth)',
    { expectedStatus: 200 }
  );
  
  await testEndpoint(
    `${LOCAL_URL}/api/debug/auth-check`,
    'Debug Auth Check (Should Require Auth)',
    { 
      expectedStatus: 401 // Should fail without authentication
    }
  );

  // 3. PUBLIC PAGES
  log('\n3️⃣ PUBLIC PAGES', 'yellow');
  
  await testPage('/', 'Homepage', {
    checkForText: ['AgendaIQ'],
    checkNotPresent: ['Error occurred', 'undefined', 'null']
  });
  
  await testPage('/auth/signin', 'Sign In Page', {
    checkForText: ['Sign in', 'Email', 'Password'],
    checkNotPresent: ['Create Admin Account', 'Initial setup']
  });
  
  await testPage('/auth/signup', 'Sign Up Page', {
    checkForText: ['Sign up', 'Email'],
    checkNotPresent: ['Error occurred']
  });
  
  await testPage('/auth/forgot-password', 'Forgot Password', {
    checkForText: ['Reset', 'Email'],
    checkNotPresent: ['Error occurred']
  });

  // 4. PROTECTED ENDPOINTS (Should require auth)
  log('\n4️⃣ PROTECTED ENDPOINTS (Should Require Auth)', 'yellow');
  
  const protectedEndpoints = [
    '/api/users',
    '/api/staff',
    '/api/meetings',
    '/api/school',
    '/api/district',
    '/api/departments',
    '/api/roles',
    '/api/audit-logs',
    '/api/dev/metrics',
    '/api/dev/stats',
    '/api/tests/history'
  ];
  
  for (const endpoint of protectedEndpoints) {
    await testEndpoint(
      `${LOCAL_URL}${endpoint}`,
      `Protected: ${endpoint}`,
      { expectedStatus: 401 }
    );
  }

  // 5. PROTECTED PAGES (Should redirect to signin)
  log('\n5️⃣ PROTECTED PAGES (Should Redirect)', 'yellow');
  
  const protectedPages = [
    '/dashboard',
    '/dashboard/meetings',
    '/dashboard/settings',
    '/dashboard/admin/create-first-admin',
    '/dashboard/development'
  ];
  
  for (const page of protectedPages) {
    await testPage(page, `Protected Page: ${page}`, {
      checkForText: ['Sign in'],
      checkNotPresent: []
    });
  }

  // 6. API SECURITY TESTS
  log('\n6️⃣ SECURITY TESTS', 'yellow');
  
  await testEndpoint(
    `${LOCAL_URL}/api/auth/create-first-admin`,
    'Create Admin (No Auth)',
    { 
      method: 'POST',
      body: { userId: 1, password: 'test1234' },
      expectedStatus: 401
    }
  );
  
  await testEndpoint(
    `${LOCAL_URL}/api/users`,
    'User List (No Auth - Should Fail)',
    { expectedStatus: 401 }
  );
  
  await testEndpoint(
    `${LOCAL_URL}/api/dev/execute`,
    'Dev Execute (No Auth - Should Fail)',
    { 
      method: 'POST',
      body: { command: 'ls' },
      expectedStatus: 401,
      critical: true
    }
  );

  // 7. DATABASE TESTS
  log('\n7️⃣ DATABASE CONNECTION', 'yellow');
  
  // Use uptime endpoint with API key to check database
  const uptimeInfo = await fetch(`${LOCAL_URL}/api/monitoring/uptime`, {
    headers: {
      'Authorization': `Bearer ${monitoringApiKey}`
    }
  });
  const uptimeData = await uptimeInfo.json();
  
  if (uptimeData.status === 'healthy' || uptimeData.status === 'ok') {
    testResults.passed.push({ name: 'Database Connection' });
    log(`  ✅ Database Connected (status: ${uptimeData.status})`, 'green');
  } else if (uptimeData.status === 'degraded') {
    testResults.warnings.push({ 
      name: 'Database Connection', 
      issue: 'Database may have issues'
    });
    log(`  ⚠️ Database Connection Degraded`, 'yellow');
  } else {
    testResults.failed.push({ 
      name: 'Database Connection', 
      critical: true,
      error: `Database not healthy: ${uptimeData.status}` 
    });
    log(`  ❌ Database Connection Failed (status: ${uptimeData.status})`, 'red');
  }

  // 8. ERROR HANDLING
  log('\n8️⃣ ERROR HANDLING', 'yellow');
  
  await testEndpoint(
    `${LOCAL_URL}/api/nonexistent`,
    '404 Handler',
    { expectedStatus: 404 }
  );

  // 9. PERFORMANCE CHECKS
  log('\n9️⃣ PERFORMANCE CHECKS', 'yellow');
  
  const perfStart = Date.now();
  await fetch(`${LOCAL_URL}/`);
  const homeLoadTime = Date.now() - perfStart;
  
  if (homeLoadTime < 1000) {
    testResults.passed.push({ name: 'Homepage Load Time', time: homeLoadTime });
    log(`  ✅ Homepage Load Time: ${homeLoadTime}ms`, 'green');
  } else {
    testResults.warnings.push({ name: 'Homepage Load Time', time: homeLoadTime });
    log(`  ⚠️ Homepage Load Time: ${homeLoadTime}ms (slow)`, 'yellow');
  }

  // 10. CONFIGURATION CHECKS
  log('\n🔟 CONFIGURATION CHECKS', 'yellow');
  
  // Check if session endpoint works
  const sessionCheck = await fetch(`${LOCAL_URL}/api/auth/session`);
  if (sessionCheck.ok) {
    testResults.passed.push({ name: 'NextAuth Configuration' });
    log(`  ✅ NextAuth Configured (session endpoint works)`, 'green');
  } else {
    testResults.warnings.push({ name: 'NextAuth Configuration' });
    log(`  ⚠️ NextAuth may not be fully configured`, 'yellow');
  }

  // FINAL SUMMARY
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60) + '\n', 'blue');

  const totalTests = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
  const passRate = ((testResults.passed.length / totalTests) * 100).toFixed(1);

  log(`Total Tests: ${totalTests}`, 'blue');
  log(`✅ Passed: ${testResults.passed.length}`, 'green');
  log(`❌ Failed: ${testResults.failed.length}`, 'red');
  log(`⚠️ Warnings: ${testResults.warnings.length}`, 'yellow');
  log(`Pass Rate: ${passRate}%\n`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');

  // Critical failures
  const criticalFailures = testResults.failed.filter(f => f.critical);
  if (criticalFailures.length > 0) {
    log('🔴 CRITICAL FAILURES:', 'red');
    criticalFailures.forEach(failure => {
      log(`  - ${failure.name}: ${failure.error || `Status ${failure.status}`}`, 'red');
    });
    log('');
  }

  // Regular failures
  const regularFailures = testResults.failed.filter(f => !f.critical);
  if (regularFailures.length > 0) {
    log('❌ FAILURES:', 'red');
    regularFailures.forEach(failure => {
      log(`  - ${failure.name}: ${failure.error || `Status ${failure.status} (expected ${failure.expected})`}`, 'red');
    });
    log('');
  }

  // Warnings
  if (testResults.warnings.length > 0) {
    log('⚠️ WARNINGS:', 'yellow');
    testResults.warnings.forEach(warning => {
      log(`  - ${warning.name}: ${warning.issue || warning.issues?.join(', ')}`, 'yellow');
    });
    log('');
  }

  // Recommendations
  log('🔧 RECOMMENDATIONS:', 'cyan');
  
  if (criticalFailures.length === 0 && regularFailures.length === 0) {
    log('  ✅ Local environment is healthy and ready for deployment!', 'green');
  } else {
    if (criticalFailures.some(f => f.name.includes('Database'))) {
      log('  1. Check DATABASE_URL in .env.local', 'yellow');
    }
    
    if (criticalFailures.some(f => f.name.includes('Health'))) {
      log('  2. Health check endpoint needs fixing', 'yellow');
    }
    
    if (testResults.warnings.length > 3) {
      log('  3. Review and fix warnings before deployment', 'yellow');
    }
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  return {
    success: criticalFailures.length === 0,
    results: testResults
  };
}

// Run the tests
runComprehensiveTests()
  .then(({ success }) => {
    if (success) {
      log('✅ Local tests completed successfully!', 'green');
      process.exit(0);
    } else {
      log('❌ Local environment has critical issues!', 'red');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
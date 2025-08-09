#!/usr/bin/env node

/**
 * Comprehensive Production Testing Suite for AgendaIQ
 * Tests all critical endpoints, pages, and functionality
 */

const PRODUCTION_URL = 'https://agendaiq.vercel.app';

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
      if (data) log(`     Error: ${JSON.stringify(data).substring(0, 100)}`, 'red');
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
    const response = await fetch(`${PRODUCTION_URL}${path}`);
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

async function runComprehensiveTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔍 COMPREHENSIVE PRODUCTION TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`URL: ${PRODUCTION_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  // 1. CRITICAL INFRASTRUCTURE TESTS
  log('1️⃣ CRITICAL INFRASTRUCTURE', 'yellow');
  
  // Note: Production will need MONITORING_API_KEY set in Vercel environment variables
  await testEndpoint(
    `${PRODUCTION_URL}/api/monitoring/uptime`,
    'Uptime Check (Requires API Key in Production)',
    { 
      expectedStatus: 401, // Will fail without API key in production
      critical: false // Not critical since we expect it to fail without key
    }
  );
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/auth/csrf`,
    'CSRF Token Generation',
    { 
      critical: true,
      validateResponse: (data) => data.csrfToken && data.csrfToken.length > 0
    }
  );
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/auth/providers`,
    'Auth Providers',
    { 
      critical: true,
      validateResponse: (data) => data.credentials !== undefined
    }
  );

  // 2. AUTHENTICATION ENDPOINTS
  log('\n2️⃣ AUTHENTICATION SYSTEM', 'yellow');
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/auth/check-first-user`,
    'First User Check',
    { 
      validateResponse: (data) => typeof data === 'boolean'
    }
  );
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/auth/session`,
    'Session Check (No Auth)',
    { expectedStatus: 200 }
  );
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/auth/callback/credentials`,
    'Credentials Callback (Invalid)',
    { 
      method: 'POST',
      body: { email: 'test@test.com', password: 'wrongpass' },
      expectedStatus: 401
    }
  );

  // 3. PUBLIC PAGES
  log('\n3️⃣ PUBLIC PAGES', 'yellow');
  
  await testPage('/', 'Homepage', {
    checkForText: ['AgendaIQ'],
    checkNotPresent: ['Error', 'undefined', 'null']
  });
  
  await testPage('/auth/signin', 'Sign In Page', {
    checkForText: ['Sign in', 'Email', 'Password'],
    checkNotPresent: ['Create Admin Account', 'Initial setup', 'Create account']
  });
  
  await testPage('/auth/signup', 'Sign Up Page', {
    checkForText: ['Sign up', 'Email'],
    checkNotPresent: ['Error']
  });
  
  await testPage('/auth/forgot-password', 'Forgot Password', {
    checkForText: ['Reset', 'Email'],
    checkNotPresent: ['Error']
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
      `${PRODUCTION_URL}${endpoint}`,
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
      checkNotPresent: ['Dashboard']
    });
  }

  // 6. API SECURITY TESTS
  log('\n6️⃣ SECURITY TESTS', 'yellow');
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/auth/create-first-admin`,
    'Create Admin (No Auth - Should Fail)',
    { 
      method: 'POST',
      body: { userId: 1, password: 'test1234' },
      expectedStatus: 401
    }
  );
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/users`,
    'User List (No Auth - Should Fail)',
    { expectedStatus: 401 }
  );
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/dev/execute`,
    'Dev Execute (No Auth - Should Fail)',
    { 
      method: 'POST',
      body: { command: 'ls' },
      expectedStatus: 401,
      critical: true
    }
  );

  // 7. RATE LIMITING TESTS
  log('\n7️⃣ RATE LIMITING', 'yellow');
  
  const rateLimitPromises = [];
  for (let i = 0; i < 10; i++) {
    rateLimitPromises.push(
      fetch(`${PRODUCTION_URL}/api/auth/session`)
    );
  }
  
  const rateLimitResponses = await Promise.all(rateLimitPromises);
  const rateLimited = rateLimitResponses.some(r => r.status === 429);
  
  if (rateLimited) {
    testResults.passed.push({ name: 'Rate Limiting Active' });
    log(`  ✅ Rate Limiting: Active (429 received)`, 'green');
  } else {
    testResults.warnings.push({ name: 'Rate Limiting', issue: 'May not be active' });
    log(`  ⚠️ Rate Limiting: May not be active`, 'yellow');
  }

  // 8. ERROR HANDLING
  log('\n8️⃣ ERROR HANDLING', 'yellow');
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/nonexistent`,
    '404 Handler',
    { expectedStatus: 404 }
  );
  
  await testEndpoint(
    `${PRODUCTION_URL}/api/auth/callback/credentials`,
    'Invalid JSON',
    { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: null,
      expectedStatus: 400
    }
  );

  // 9. PERFORMANCE CHECKS
  log('\n9️⃣ PERFORMANCE CHECKS', 'yellow');
  
  const perfStart = Date.now();
  await fetch(`${PRODUCTION_URL}/`);
  const homeLoadTime = Date.now() - perfStart;
  
  if (homeLoadTime < 3000) {
    testResults.passed.push({ name: 'Homepage Load Time', time: homeLoadTime });
    log(`  ✅ Homepage Load Time: ${homeLoadTime}ms`, 'green');
  } else {
    testResults.warnings.push({ name: 'Homepage Load Time', time: homeLoadTime });
    log(`  ⚠️ Homepage Load Time: ${homeLoadTime}ms (slow)`, 'yellow');
  }

  // 10. DATABASE CONNECTION
  log('\n🔟 DATABASE & ENVIRONMENT', 'yellow');
  
  // Check database via uptime endpoint (no auth required)
  const uptimeCheck = await fetch(`${PRODUCTION_URL}/api/monitoring/uptime`);
  const uptimeData = await uptimeCheck.json();
  
  if (uptimeData.status === 'healthy') {
    testResults.passed.push({ name: 'Database Connection' });
    log(`  ✅ Database Connection: Healthy`, 'green');
  } else if (uptimeData.status === 'degraded') {
    testResults.warnings.push({ 
      name: 'Database Connection',
      issue: 'Database may have issues' 
    });
    log(`  ⚠️ Database Connection: Degraded`, 'yellow');
  } else {
    testResults.failed.push({ 
      name: 'Database Connection', 
      critical: true,
      error: 'Database not connected' 
    });
    log(`  ❌ Database Connection: Failed`, 'red');
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
  log(`Pass Rate: ${passRate}%\n`, passRate >= 80 ? 'green' : 'red');

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
  
  if (criticalFailures.some(f => f.name.includes('Database'))) {
    log('  1. Check DATABASE_URL in Vercel environment variables', 'yellow');
  }
  
  if (criticalFailures.some(f => f.name.includes('Health'))) {
    log('  2. Health check endpoint needs fixing - check middleware', 'yellow');
  }
  
  if (testResults.warnings.some(w => w.name.includes('Rate Limiting'))) {
    log('  3. Verify rate limiting is properly configured', 'yellow');
  }
  
  if (regularFailures.length === 0 && criticalFailures.length === 0) {
    log('  ✅ Production is healthy and secure!', 'green');
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
      log('✅ Production tests completed successfully!', 'green');
      process.exit(0);
    } else {
      log('❌ Production has critical issues!', 'red');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * Production Diagnostic Tool
 * Diagnoses and fixes production issues for AgendaIQ
 */

const PRODUCTION_URL = 'https://agendaiq.vercel.app';
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

async function testEndpoint(url, name, expectedResponse = null) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      log(`  ✅ ${name}: ${response.status} OK`, 'green');
      
      if (expectedResponse !== null) {
        const matches = JSON.stringify(data) === JSON.stringify(expectedResponse);
        if (!matches) {
          log(`     ⚠️ Unexpected response: ${JSON.stringify(data)}`, 'yellow');
          return { success: false, data, error: 'Unexpected response' };
        }
      }
      
      return { success: true, data };
    } else {
      log(`  ❌ ${name}: ${response.status} ${response.statusText}`, 'red');
      log(`     Error: ${JSON.stringify(data)}`, 'red');
      return { success: false, data, error: response.statusText };
    }
  } catch (error) {
    log(`  ❌ ${name}: Network error - ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function diagnoseProduction() {
  log('\n🔍 PRODUCTION DIAGNOSTICS FOR AGENDAIQ\n', 'cyan');
  log(`URL: ${PRODUCTION_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  const issues = [];

  // 1. Test Database Connection
  log('1️⃣ Testing Database Connection...', 'yellow');
  
  const healthCheck = await testEndpoint(
    `${PRODUCTION_URL}/api/monitoring/health`,
    'Health Check'
  );
  
  if (!healthCheck.success || healthCheck.data?.checks?.database === false) {
    issues.push({
      severity: 'CRITICAL',
      component: 'Database',
      issue: 'Database connection failed',
      solution: 'Check DATABASE_URL environment variable in Vercel'
    });
  }

  // 2. Test First User Check (Critical for login page)
  log('\n2️⃣ Testing First User Check API...', 'yellow');
  
  const firstUserCheck = await testEndpoint(
    `${PRODUCTION_URL}/api/auth/check-first-user`,
    'First User Check'
  );
  
  if (firstUserCheck.success) {
    if (firstUserCheck.data === true) {
      issues.push({
        severity: 'CRITICAL',
        component: 'Auth',
        issue: 'API returns true (no users) but database has users',
        solution: 'Database connection issue or wrong database'
      });
      log('     ⚠️ Returns TRUE (thinks no users exist)', 'red');
    } else if (firstUserCheck.data === false) {
      log('     ✅ Returns FALSE (users exist)', 'green');
    } else if (firstUserCheck.data?.error) {
      issues.push({
        severity: 'CRITICAL',
        component: 'Auth',
        issue: `First user check error: ${firstUserCheck.data.error}`,
        solution: 'Fix database connection'
      });
    }
  }

  // 3. Test Auth Providers
  log('\n3️⃣ Testing Authentication Providers...', 'yellow');
  
  const authProviders = await testEndpoint(
    `${PRODUCTION_URL}/api/auth/providers`,
    'Auth Providers'
  );
  
  if (!authProviders.success || !authProviders.data?.credentials) {
    issues.push({
      severity: 'HIGH',
      component: 'NextAuth',
      issue: 'Authentication providers not configured',
      solution: 'Check NextAuth configuration'
    });
  }

  // 4. Test CSRF Token
  log('\n4️⃣ Testing CSRF Token Generation...', 'yellow');
  
  const csrfToken = await testEndpoint(
    `${PRODUCTION_URL}/api/auth/csrf`,
    'CSRF Token'
  );
  
  if (!csrfToken.success || !csrfToken.data?.csrfToken) {
    issues.push({
      severity: 'HIGH',
      component: 'NextAuth',
      issue: 'CSRF token generation failed',
      solution: 'Check NEXTAUTH_SECRET environment variable'
    });
  }

  // 5. Test Critical Pages
  log('\n5️⃣ Testing Critical Pages...', 'yellow');
  
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/auth/signin', name: 'Sign In Page' },
    { path: '/auth/signup', name: 'Sign Up Page' },
  ];
  
  for (const page of pages) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${page.path}`);
      if (response.ok) {
        log(`  ✅ ${page.name}: ${response.status} OK`, 'green');
        
        // Check for "create account" text in signin page
        if (page.path === '/auth/signin') {
          const html = await response.text();
          if (html.includes('Create Admin Account') || html.includes('Complete the initial setup')) {
            issues.push({
              severity: 'CRITICAL',
              component: 'Auth UI',
              issue: 'Sign-in page shows "Create Admin Account"',
              solution: 'First user check API is failing or returning wrong value'
            });
            log('     ⚠️ Page shows "Create Admin Account" incorrectly!', 'red');
          }
        }
      } else {
        log(`  ❌ ${page.name}: ${response.status}`, 'red');
      }
    } catch (error) {
      log(`  ❌ ${page.name}: ${error.message}`, 'red');
    }
  }

  // 6. Test Environment Variables
  log('\n6️⃣ Checking Environment Configuration...', 'yellow');
  
  const envCheck = await testEndpoint(
    `${PRODUCTION_URL}/api/debug/production-status`,
    'Environment Check'
  );
  
  if (envCheck.success && envCheck.data) {
    if (!envCheck.data.database?.connected) {
      issues.push({
        severity: 'CRITICAL',
        component: 'Environment',
        issue: 'Database not connected in production',
        solution: 'DATABASE_URL not set or incorrect in Vercel'
      });
    }
    if (!envCheck.data.nextAuth?.configured) {
      issues.push({
        severity: 'HIGH',
        component: 'Environment',
        issue: 'NextAuth not properly configured',
        solution: 'NEXTAUTH_URL and NEXTAUTH_SECRET not set in Vercel'
      });
    }
  }

  // 7. Compare with Local
  log('\n7️⃣ Comparing with Local Environment...', 'yellow');
  
  try {
    const localFirstUser = await fetch(`${LOCAL_URL}/api/auth/check-first-user`);
    const localData = await localFirstUser.json();
    
    log(`  Local returns: ${localData}`, 'cyan');
    log(`  Production returns: ${JSON.stringify(firstUserCheck.data)}`, 'cyan');
    
    if (localData !== firstUserCheck.data) {
      issues.push({
        severity: 'HIGH',
        component: 'Environment Mismatch',
        issue: 'Local and production return different values',
        solution: 'Production database connection issue'
      });
    }
  } catch (error) {
    log('  ⚠️ Cannot compare with local (server not running)', 'yellow');
  }

  // DIAGNOSIS SUMMARY
  log('\n' + '='.repeat(60), 'blue');
  log('📊 DIAGNOSIS SUMMARY', 'cyan');
  log('='.repeat(60) + '\n', 'blue');

  if (issues.length === 0) {
    log('✅ No issues detected!', 'green');
  } else {
    log(`Found ${issues.length} issue(s):\n`, 'red');
    
    // Group by severity
    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');
    
    if (critical.length > 0) {
      log('🔴 CRITICAL ISSUES:', 'red');
      critical.forEach((issue, i) => {
        log(`\n  ${i + 1}. ${issue.component}: ${issue.issue}`, 'red');
        log(`     Solution: ${issue.solution}`, 'yellow');
      });
    }
    
    if (high.length > 0) {
      log('\n🟡 HIGH PRIORITY ISSUES:', 'yellow');
      high.forEach((issue, i) => {
        log(`\n  ${i + 1}. ${issue.component}: ${issue.issue}`, 'yellow');
        log(`     Solution: ${issue.solution}`, 'cyan');
      });
    }
  }

  // RECOMMENDED ACTIONS
  log('\n' + '='.repeat(60), 'blue');
  log('🔧 RECOMMENDED ACTIONS', 'cyan');
  log('='.repeat(60) + '\n', 'blue');

  if (issues.some(i => i.component === 'Database')) {
    log('1. Check Vercel Environment Variables:', 'yellow');
    log('   - Go to: https://vercel.com/hsandir/agendaiq/settings/environment-variables', 'cyan');
    log('   - Verify DATABASE_URL is set correctly', 'cyan');
    log('   - Format: postgresql://user:password@host:port/database', 'cyan');
    log('   - Must match your Supabase connection string', 'cyan');
  }

  if (issues.some(i => i.component === 'NextAuth' || i.component === 'Auth')) {
    log('\n2. Check NextAuth Configuration:', 'yellow');
    log('   - NEXTAUTH_URL = https://agendaiq.vercel.app', 'cyan');
    log('   - NEXTAUTH_SECRET must be set (use: openssl rand -base64 32)', 'cyan');
  }

  if (issues.some(i => i.issue.includes('First user check'))) {
    log('\n3. Fix First User Check:', 'yellow');
    log('   - The API should return false when database has users', 'cyan');
    log('   - Currently it may be returning error or true', 'cyan');
    log('   - This causes the "Create Admin Account" page to show', 'cyan');
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');
  
  return issues;
}

// Run diagnostics
diagnoseProduction()
  .then(issues => {
    if (issues.length > 0) {
      log('❌ Production has issues that need fixing!', 'red');
      process.exit(1);
    } else {
      log('✅ Production is healthy!', 'green');
      process.exit(0);
    }
  })
  .catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
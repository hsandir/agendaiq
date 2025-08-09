#!/usr/bin/env node

/**
 * Regression Test Suite for AgendaIQ
 * Tests critical user flows to ensure no functionality breaks
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

async function testRegression() {
  const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://agendaiq.vercel.app' 
    : 'http://localhost:3000';

  log('\n🔄 REGRESSION TEST SUITE', 'cyan');
  log('='.repeat(60), 'blue');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'blue');
  log(`URL: ${BASE_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  // 1. CRITICAL USER FLOWS
  log('1️⃣ CRITICAL USER FLOWS', 'yellow');
  
  const criticalFlows = [
    {
      name: 'Login Flow',
      endpoints: [
        { path: '/auth/signin', method: 'GET', expectedStatus: 200 },
        { path: '/api/auth/csrf', method: 'GET', expectedStatus: 200 },
        { path: '/api/auth/providers', method: 'GET', expectedStatus: 200 }
      ]
    },
    {
      name: 'Dashboard Access',
      endpoints: [
        { path: '/dashboard', method: 'GET', expectedStatus: [200, 307] }, // Redirect if not logged in
        { path: '/api/auth/session', method: 'GET', expectedStatus: 200 }
      ]
    },
    {
      name: 'Meeting Management',
      endpoints: [
        { path: '/api/meetings', method: 'GET', expectedStatus: [200, 401] },
        { path: '/api/meetings/history', method: 'GET', expectedStatus: [200, 401] }
      ]
    },
    {
      name: 'User Management',
      endpoints: [
        { path: '/api/users', method: 'GET', expectedStatus: [200, 401] },
        { path: '/api/staff', method: 'GET', expectedStatus: [200, 401] }
      ]
    }
  ];

  for (const flow of criticalFlows) {
    log(`\n  Testing: ${flow.name}`, 'cyan');
    let flowPassed = true;
    
    for (const endpoint of flow.endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
          ? endpoint.expectedStatus 
          : [endpoint.expectedStatus];
        
        if (expectedStatuses.includes(response.status)) {
          log(`    ✅ ${endpoint.method} ${endpoint.path}: ${response.status}`, 'green');
        } else {
          flowPassed = false;
          log(`    ❌ ${endpoint.method} ${endpoint.path}: ${response.status} (expected ${expectedStatuses.join(' or ')})`, 'red');
        }
      } catch (error) {
        flowPassed = false;
        log(`    ❌ ${endpoint.method} ${endpoint.path}: Network error`, 'red');
      }
    }
    
    if (flowPassed) {
      testResults.passed.push({ test: flow.name });
    } else {
      testResults.failed.push({ test: flow.name });
    }
  }

  // 2. BACKWARD COMPATIBILITY
  log('\n2️⃣ BACKWARD COMPATIBILITY', 'yellow');
  
  // Test old API endpoints still work
  const legacyEndpoints = [
    '/api/auth/check-first-user',
    '/api/setup/check',
    '/api/school',
    '/api/district'
  ];
  
  for (const endpoint of legacyEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (response.status !== 404) {
        testResults.passed.push({ test: `Legacy endpoint exists: ${endpoint}` });
        log(`  ✅ ${endpoint}: Still available (${response.status})`, 'green');
      } else {
        testResults.warnings.push({ test: `Legacy endpoint removed: ${endpoint}` });
        log(`  ⚠️ ${endpoint}: Removed (404)`, 'yellow');
      }
    } catch (error) {
      testResults.warnings.push({ test: `Legacy endpoint unreachable: ${endpoint}` });
      log(`  ⚠️ ${endpoint}: Unreachable`, 'yellow');
    }
  }

  // 3. FEATURE FLAG TESTS
  log('\n3️⃣ FEATURE FLAGS', 'yellow');
  
  const featureFlags = [
    { name: 'NEW_DASHBOARD', env: 'NEXT_PUBLIC_FEATURE_NEW_DASHBOARD' },
    { name: 'MEETING_INTELLIGENCE', env: 'NEXT_PUBLIC_FEATURE_MEETING_INTELLIGENCE' },
    { name: 'ADVANCED_RBAC', env: 'NEXT_PUBLIC_FEATURE_ADVANCED_RBAC' }
  ];
  
  for (const feature of featureFlags) {
    const isEnabled = process.env[feature.env] === 'true';
    
    if (isEnabled) {
      testResults.passed.push({ test: `Feature enabled: ${feature.name}` });
      log(`  ✅ ${feature.name}: Enabled`, 'green');
    } else {
      log(`  ⭕ ${feature.name}: Disabled`, 'cyan');
    }
  }

  // 4. DATABASE MIGRATION VERIFICATION
  log('\n4️⃣ DATABASE MIGRATIONS', 'yellow');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check if latest migrations are applied
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 5
    `;
    
    if (migrations && migrations.length > 0) {
      testResults.passed.push({ test: 'Migrations applied' });
      log(`  ✅ Latest migrations applied:`, 'green');
      migrations.forEach(m => {
        log(`     - ${m.migration_name}`, 'cyan');
      });
    } else {
      testResults.warnings.push({ test: 'No migrations found' });
      log(`  ⚠️ No migration history found`, 'yellow');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    testResults.warnings.push({ test: 'Migration check failed' });
    log(`  ⚠️ Could not check migrations: ${error.message}`, 'yellow');
  }

  // 5. CRITICAL CONFIG VERIFICATION
  log('\n5️⃣ CRITICAL CONFIGURATION', 'yellow');
  
  const criticalConfigs = [
    { name: 'NextAuth Secret', env: 'NEXTAUTH_SECRET', critical: true },
    { name: 'Database URL', env: 'DATABASE_URL', critical: true },
    { name: 'NextAuth URL', env: 'NEXTAUTH_URL', critical: false },
    { name: 'Monitoring API Key', env: 'MONITORING_API_KEY', critical: false }
  ];
  
  for (const config of criticalConfigs) {
    if (process.env[config.env]) {
      testResults.passed.push({ test: `Config set: ${config.name}` });
      log(`  ✅ ${config.name}: Configured`, 'green');
    } else {
      if (config.critical) {
        testResults.failed.push({ test: `Missing critical config: ${config.name}` });
        log(`  ❌ ${config.name}: Missing (CRITICAL)`, 'red');
      } else {
        testResults.warnings.push({ test: `Missing config: ${config.name}` });
        log(`  ⚠️ ${config.name}: Not configured`, 'yellow');
      }
    }
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

  if (testResults.failed.length > 0) {
    log('❌ CRITICAL REGRESSION ISSUES:', 'red');
    testResults.failed.forEach(failure => {
      log(`  - ${failure.test}`, 'red');
    });
    log('\n⚠️ DO NOT DEPLOY - Fix regression issues first!', 'red');
  } else {
    log('✅ No regression issues detected - Safe to deploy', 'green');
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
testRegression().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
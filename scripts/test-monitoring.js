#!/usr/bin/env node

/**
 * Monitoring & Error Reporting Test Suite for AgendaIQ
 * Tests Sentry integration, error tracking, and alerting
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

async function testMonitoring() {
  const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://agendaiq.vercel.app' 
    : 'http://localhost:3000';

  log('\n🔍 MONITORING & ERROR REPORTING TEST SUITE', 'cyan');
  log('='.repeat(60), 'blue');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'blue');
  log(`URL: ${BASE_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  // 1. SENTRY CONFIGURATION TEST
  log('1️⃣ SENTRY CONFIGURATION', 'yellow');
  
  try {
    // Check Sentry environment variables
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
    const sentryOrg = process.env.SENTRY_ORG;
    const sentryProject = process.env.SENTRY_PROJECT;
    
    if (sentryDsn) {
      testResults.passed.push({ test: 'Sentry DSN configured' });
      log(`  ✅ Sentry DSN is configured`, 'green');
    } else {
      testResults.warnings.push({ test: 'Sentry DSN not configured' });
      log(`  ⚠️ Sentry DSN not found in environment`, 'yellow');
    }
    
    if (sentryOrg && sentryProject) {
      testResults.passed.push({ test: 'Sentry project configured' });
      log(`  ✅ Sentry org/project configured`, 'green');
    } else {
      testResults.warnings.push({ test: 'Sentry project not configured' });
      log(`  ⚠️ Sentry org/project not configured`, 'yellow');
    }
    
    // Test Sentry error capture
    if (sentryDsn) {
      try {
        const response = await fetch(`${BASE_URL}/api/test-sentry`);
        if (response.ok) {
          testResults.passed.push({ test: 'Sentry test endpoint works' });
          log(`  ✅ Sentry test endpoint responsive`, 'green');
        } else {
          testResults.warnings.push({ test: 'Sentry test endpoint failed' });
          log(`  ⚠️ Sentry test endpoint returned ${response.status}`, 'yellow');
        }
      } catch (error) {
        testResults.warnings.push({ test: 'Sentry test endpoint unreachable' });
        log(`  ⚠️ Could not reach Sentry test endpoint`, 'yellow');
      }
    }
    
  } catch (error) {
    testResults.failed.push({ test: 'Sentry configuration check', error: error.message });
    log(`  ❌ Sentry configuration check failed: ${error.message}`, 'red');
  }

  // 2. ERROR LOGGING TEST
  log('\n2️⃣ ERROR LOGGING', 'yellow');
  
  try {
    // Check if audit logs are being created
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const recentErrors = await prisma.auditLog.count({
      where: {
        operation: 'ERROR',
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    log(`  📊 Errors logged in last 24h: ${recentErrors}`, 'cyan');
    testResults.passed.push({ test: 'Error logging active', count: recentErrors });
    
    // Check critical error rate
    const criticalErrors = await prisma.auditLog.count({
      where: {
        operation: 'ERROR',
        metadata: {
          path: ['severity'],
          equals: 'critical'
        },
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });
    
    if (criticalErrors > 10) {
      testResults.failed.push({ 
        test: 'High critical error rate', 
        count: criticalErrors 
      });
      log(`  ❌ High critical error rate: ${criticalErrors} in last hour`, 'red');
    } else {
      testResults.passed.push({ test: 'Critical error rate acceptable' });
      log(`  ✅ Critical error rate acceptable: ${criticalErrors} in last hour`, 'green');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    testResults.warnings.push({ test: 'Error logging check', error: error.message });
    log(`  ⚠️ Could not check error logs: ${error.message}`, 'yellow');
  }

  // 3. PERFORMANCE MONITORING
  log('\n3️⃣ PERFORMANCE MONITORING', 'yellow');
  
  try {
    // Test response time tracking
    const endpoints = [
      '/api/monitoring/uptime',
      '/api/auth/session',
      '/api/health'
    ];
    
    for (const endpoint of endpoints) {
      const start = Date.now();
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          headers: endpoint.includes('monitoring') ? {
            'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
          } : {}
        });
        const duration = Date.now() - start;
        
        if (duration > 1000) {
          testResults.warnings.push({ 
            test: `Slow endpoint: ${endpoint}`, 
            duration 
          });
          log(`  ⚠️ ${endpoint}: ${duration}ms (slow)`, 'yellow');
        } else {
          testResults.passed.push({ 
            test: `Endpoint performance: ${endpoint}`, 
            duration 
          });
          log(`  ✅ ${endpoint}: ${duration}ms`, 'green');
        }
      } catch (error) {
        testResults.warnings.push({ 
          test: `Endpoint unreachable: ${endpoint}` 
        });
        log(`  ⚠️ ${endpoint}: Unreachable`, 'yellow');
      }
    }
    
  } catch (error) {
    testResults.failed.push({ test: 'Performance monitoring', error: error.message });
    log(`  ❌ Performance monitoring failed: ${error.message}`, 'red');
  }

  // 4. ALERT SYSTEM TEST
  log('\n4️⃣ ALERT SYSTEM', 'yellow');
  
  try {
    // Check if alerting is configured
    const alertingConfigured = !!(
      process.env.SLACK_WEBHOOK_URL || 
      process.env.DISCORD_WEBHOOK_URL ||
      process.env.EMAIL_ALERTS_ENABLED
    );
    
    if (alertingConfigured) {
      testResults.passed.push({ test: 'Alert system configured' });
      log(`  ✅ Alert system is configured`, 'green');
      
      if (process.env.SLACK_WEBHOOK_URL) {
        log(`     - Slack alerts enabled`, 'cyan');
      }
      if (process.env.DISCORD_WEBHOOK_URL) {
        log(`     - Discord alerts enabled`, 'cyan');
      }
      if (process.env.EMAIL_ALERTS_ENABLED) {
        log(`     - Email alerts enabled`, 'cyan');
      }
    } else {
      testResults.warnings.push({ test: 'No alert system configured' });
      log(`  ⚠️ No alert system configured`, 'yellow');
    }
    
  } catch (error) {
    testResults.failed.push({ test: 'Alert system check', error: error.message });
    log(`  ❌ Alert system check failed: ${error.message}`, 'red');
  }

  // 5. UPTIME MONITORING
  log('\n5️⃣ UPTIME MONITORING', 'yellow');
  
  try {
    // Check if uptime monitoring is accessible
    const monitoringKey = process.env.MONITORING_API_KEY;
    
    if (!monitoringKey) {
      testResults.warnings.push({ test: 'Monitoring API key not set' });
      log(`  ⚠️ MONITORING_API_KEY not configured`, 'yellow');
    } else {
      const response = await fetch(`${BASE_URL}/api/monitoring/uptime`, {
        headers: {
          'Authorization': `Bearer ${monitoringKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'healthy' || data.status === 'ok') {
          testResults.passed.push({ test: 'Uptime monitoring healthy' });
          log(`  ✅ Uptime monitoring: ${data.status}`, 'green');
        } else {
          testResults.warnings.push({ test: 'System degraded', status: data.status });
          log(`  ⚠️ System status: ${data.status}`, 'yellow');
        }
      } else {
        testResults.failed.push({ test: 'Uptime monitoring failed' });
        log(`  ❌ Uptime monitoring returned ${response.status}`, 'red');
      }
    }
    
  } catch (error) {
    testResults.failed.push({ test: 'Uptime monitoring', error: error.message });
    log(`  ❌ Uptime monitoring check failed: ${error.message}`, 'red');
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
    log('RECOMMENDATIONS:', 'cyan');
    log('  1. Configure Sentry for error tracking', 'yellow');
    log('  2. Set up alerting webhooks (Slack/Discord)', 'yellow');
    log('  3. Configure MONITORING_API_KEY in environment', 'yellow');
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
testMonitoring().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
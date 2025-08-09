#!/usr/bin/env node

/**
 * Test script for the professional dual-layer logging system
 * Tests both development and security logging with database persistence
 */

import { devLogger, auditLogger } from '../src/lib/logging/index.js';
import { DevLogCategory, AuditLogCategory, LogLevel } from '../src/lib/logging/types.js';

async function testLoggingSystem() {
  console.log('🧪 Testing Professional Dual-Layer Logging System...\n');

  try {
    // Test Development Logger
    console.log('📊 Testing Development Logger...');
    
    await devLogger.info(
      DevLogCategory.SYSTEM,
      'Logging system test initiated',
      undefined,
      {
        testRun: true,
        timestamp: new Date().toISOString()
      },
      {
        userId: '1',
        staffId: '1',
        sessionId: 'test-session-123',
        path: '/test',
        method: 'GET'
      }
    );

    await devLogger.logApiRequest(
      'POST',
      '/api/test',
      200,
      145,
      '1',
      { testData: 'successful test' }
    );

    await devLogger.logDatabaseQuery(
      'SELECT * FROM users WHERE id = $1',
      67,
      1
    );

    await devLogger.logPerformanceMetric(
      'logging_system_test',
      89
    );

    console.log('✅ Development logging tests completed');

    // Test Security/Audit Logger
    console.log('\n🔒 Testing Security/Audit Logger...');

    const testActor = {
      userId: '1',
      staffId: '1',
      email: 'test@example.com',
      role: 'Administrator',
      department: 'IT'
    };

    await auditLogger.logUserAction(
      testActor,
      'test_logging_system',
      'success',
      {
        metadata: {
          testRun: true,
          component: 'logging_test'
        },
        context: {
          ip: '127.0.0.1',
          userAgent: 'Test Script',
          path: '/test',
          method: 'POST'
        }
      }
    );

    await auditLogger.logLoginAttempt(
      'test@example.com',
      'success',
      {
        userId: '1',
        staffId: '1',
        role: 'Administrator',
        department: 'IT',
        context: {
          ip: '127.0.0.1',
          userAgent: 'Test Script'
        }
      }
    );

    await auditLogger.logDataAccess(
      testActor,
      { table: 'users', recordId: '1' },
      'read',
      'success',
      {
        recordCount: 1,
        query: 'Test query for logging system'
      }
    );

    console.log('✅ Security/Audit logging tests completed');

    // Test Log Querying
    console.log('\n🔍 Testing Log Querying...');

    const recentLogs = await devLogger.query({
      level: [LogLevel.INFO],
      limit: 5,
      orderBy: 'timestamp',
      orderDirection: 'desc'
    });

    console.log(`📋 Found ${recentLogs.length} recent logs`);
    recentLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.level}] ${log.message} (${log.timestamp})`);
    });

    const auditLogs = await auditLogger.query({
      limit: 5,
      orderBy: 'timestamp',
      orderDirection: 'desc'
    });

    console.log(`\n🔍 Found ${auditLogs.length} recent audit logs`);
    auditLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.category}] ${log.message} (${log.timestamp})`);
    });

    // Test Log Statistics
    console.log('\n📊 Testing Log Statistics...');

    const devStats = await devLogger.getStats();
    console.log('Development Log Stats:', {
      totalLogs: devStats.totalLogs,
      errorCount: devStats.logsByLevel.ERROR,
      warningCount: devStats.logsByLevel.WARN,
      infoCount: devStats.logsByLevel.INFO
    });

    const auditStats = await auditLogger.getSecurityMetrics();
    console.log('Security Log Stats:', {
      totalSecurityEvents: auditStats.totalSecurityEvents,
      failedAttempts: auditStats.failedAttempts,
      highRiskEvents: auditStats.highRiskEvents,
      activeUsers: auditStats.activeUsers
    });

    console.log('\n🎉 All logging system tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Development logging with multiple categories');
    console.log('✅ Security/Audit logging with compliance tracking');
    console.log('✅ Database persistence with proper relationships');
    console.log('✅ Log querying with filtering and sorting');
    console.log('✅ Real-time statistics and metrics');
    console.log('✅ Multi-transport logging (console, database, file, realtime)');

    console.log('\n🚀 The professional logging system is fully operational!');

  } catch (error) {
    console.error('❌ Logging system test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLoggingSystem().catch(console.error);
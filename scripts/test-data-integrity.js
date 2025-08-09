#!/usr/bin/env node

/**
 * Data Integrity Test Suite for AgendaIQ
 * Verifies database consistency, migrations, and data relationships
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function testDatabaseIntegrity() {
  log('\n📊 DATA INTEGRITY TEST SUITE', 'cyan');
  log('='.repeat(60), 'blue');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  // 1. SCHEMA CONSISTENCY TESTS
  log('1️⃣ SCHEMA CONSISTENCY', 'yellow');
  
  try {
    // Check if all required tables exist
    const requiredTables = [
      'User', 'Staff', 'Role', 'District', 'School', 
      'Department', 'Meeting', 'MeetingNote', 'AuditLog'
    ];
    
    for (const table of requiredTables) {
      try {
        const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
        testResults.passed.push({ test: `Table ${table} exists`, count });
        log(`  ✅ Table ${table}: ${count} records`, 'green');
      } catch (error) {
        testResults.failed.push({ test: `Table ${table} missing`, error: error.message });
        log(`  ❌ Table ${table}: Missing or inaccessible`, 'red');
      }
    }
  } catch (error) {
    log(`  ❌ Schema check failed: ${error.message}`, 'red');
  }

  // 2. REFERENTIAL INTEGRITY TESTS
  log('\n2️⃣ REFERENTIAL INTEGRITY', 'yellow');
  
  try {
    // Check orphaned staff records
    const orphanedStaff = await prisma.staff.findMany({
      where: {
        OR: [
          { userId: null },
          { roleId: null },
          { districtId: null }
        ]
      }
    });
    
    if (orphanedStaff.length > 0) {
      testResults.warnings.push({ 
        test: 'Orphaned Staff Records', 
        count: orphanedStaff.length 
      });
      log(`  ⚠️ Found ${orphanedStaff.length} orphaned staff records`, 'yellow');
    } else {
      testResults.passed.push({ test: 'No orphaned staff records' });
      log(`  ✅ No orphaned staff records`, 'green');
    }
    
    // Check meetings without organizers
    const orphanedMeetings = await prisma.meeting.findMany({
      where: { organizerId: null }
    });
    
    if (orphanedMeetings.length > 0) {
      testResults.warnings.push({ 
        test: 'Meetings without organizers', 
        count: orphanedMeetings.length 
      });
      log(`  ⚠️ Found ${orphanedMeetings.length} meetings without organizers`, 'yellow');
    } else {
      testResults.passed.push({ test: 'All meetings have organizers' });
      log(`  ✅ All meetings have organizers`, 'green');
    }
    
  } catch (error) {
    log(`  ❌ Referential integrity check failed: ${error.message}`, 'red');
  }

  // 3. DATA CONSISTENCY TESTS
  log('\n3️⃣ DATA CONSISTENCY', 'yellow');
  
  try {
    // Check users with multiple staff records
    const duplicateStaff = await prisma.$queryRaw`
      SELECT "user_id", COUNT(*) as count 
      FROM "Staff" 
      WHERE "user_id" IS NOT NULL
      GROUP BY "user_id" 
      HAVING COUNT(*) > 1
    `;
    
    if (duplicateStaff.length > 0) {
      testResults.failed.push({ 
        test: 'Users with multiple staff records', 
        count: duplicateStaff.length 
      });
      log(`  ❌ Found ${duplicateStaff.length} users with multiple staff records`, 'red');
    } else {
      testResults.passed.push({ test: 'No duplicate staff records' });
      log(`  ✅ No users have duplicate staff records`, 'green');
    }
    
    // Check role hierarchy consistency
    const roles = await prisma.role.findMany();
    const duplicatePriorities = {};
    
    roles.forEach(role => {
      if (!duplicatePriorities[role.priority]) {
        duplicatePriorities[role.priority] = [];
      }
      duplicatePriorities[role.priority].push(role.title);
    });
    
    const conflicts = Object.entries(duplicatePriorities)
      .filter(([_, roles]) => roles.length > 1);
    
    if (conflicts.length > 0) {
      testResults.warnings.push({ 
        test: 'Role priority conflicts', 
        conflicts 
      });
      log(`  ⚠️ Found role priority conflicts:`, 'yellow');
      conflicts.forEach(([priority, roles]) => {
        log(`     Priority ${priority}: ${roles.join(', ')}`, 'yellow');
      });
    } else {
      testResults.passed.push({ test: 'Role priorities are unique' });
      log(`  ✅ All role priorities are unique`, 'green');
    }
    
  } catch (error) {
    log(`  ❌ Data consistency check failed: ${error.message}`, 'red');
  }

  // 4. REQUIRED DATA TESTS
  log('\n4️⃣ REQUIRED DATA PRESENCE', 'yellow');
  
  try {
    // Check for at least one admin user
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { isAdmin: true },
          { isSystemAdmin: true },
          { Staff: { some: { Role: { key: 'DEV_ADMIN' } } } },
          { Staff: { some: { Role: { key: 'OPS_ADMIN' } } } }
        ]
      }
    });
    
    if (adminUsers.length === 0) {
      testResults.failed.push({ test: 'No admin users found' });
      log(`  ❌ No admin users in system`, 'red');
    } else {
      testResults.passed.push({ test: 'Admin users exist', count: adminUsers.length });
      log(`  ✅ Found ${adminUsers.length} admin users`, 'green');
    }
    
    // Check for required roles
    const requiredRoles = ['Administrator', 'Teacher', 'Principal'];
    for (const roleTitle of requiredRoles) {
      const role = await prisma.role.findFirst({
        where: { title: roleTitle }
      });
      
      if (!role) {
        testResults.failed.push({ test: `Missing required role: ${roleTitle}` });
        log(`  ❌ Required role missing: ${roleTitle}`, 'red');
      } else {
        testResults.passed.push({ test: `Required role exists: ${roleTitle}` });
        log(`  ✅ Required role exists: ${roleTitle}`, 'green');
      }
    }
    
  } catch (error) {
    log(`  ❌ Required data check failed: ${error.message}`, 'red');
  }

  // 5. DATE FIELD INTEGRITY
  log('\n5️⃣ DATE FIELD INTEGRITY', 'yellow');
  
  try {
    // Check for future-dated creation timestamps
    const futureDatedRecords = await prisma.user.findMany({
      where: {
        createdAt: {
          gt: new Date()
        }
      }
    });
    
    if (futureDatedRecords.length > 0) {
      testResults.warnings.push({ 
        test: 'Future-dated records', 
        count: futureDatedRecords.length 
      });
      log(`  ⚠️ Found ${futureDatedRecords.length} future-dated records`, 'yellow');
    } else {
      testResults.passed.push({ test: 'No future-dated records' });
      log(`  ✅ All timestamps are valid`, 'green');
    }
    
  } catch (error) {
    log(`  ❌ Date integrity check failed: ${error.message}`, 'red');
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
    log('❌ CRITICAL ISSUES:', 'red');
    testResults.failed.forEach(failure => {
      log(`  - ${failure.test}`, 'red');
    });
  }

  if (testResults.warnings.length > 0) {
    log('\n⚠️ WARNINGS:', 'yellow');
    testResults.warnings.forEach(warning => {
      log(`  - ${warning.test}`, 'yellow');
    });
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  await prisma.$disconnect();
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
testDatabaseIntegrity().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
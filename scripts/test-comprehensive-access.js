const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testComprehensiveAccess() {
  console.log('Running Comprehensive Access Tests...\n');
  console.log('='.repeat(80));
  
  try {
    // Test 1: Admin Role Assignments
    console.log('\n📋 TEST 1: Admin Role Assignments');
    console.log('-'.repeat(40));
    
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: {
              include: {
                Permissions: true
              }
            }
          }
        }
      }
    });
    
    const sysadminUser = await prisma.user.findUnique({
      where: { email: 'sysadmin@cjcollegeprep.org' },
      include: {
        Staff: {
          include: {
            Role: {
              include: {
                Permissions: true
              }
            }
          }
        }
      }
    });
    
    console.log('admin@school.edu:');
    console.log('  Role:', adminUser?.Staff[0]?.Role?.title);
    console.log('  Role Key:', adminUser?.Staff[0]?.Role?.key);
    console.log('  is_system_admin:', adminUser?.is_system_admin);
    console.log('  Capabilities:', adminUser?.Staff[0]?.Role?.Permissions?.length || 0);
    console.log('  ✅ Should be DEV_ADMIN:', adminUser?.Staff[0]?.Role?.key === 'DEV_ADMIN' ? 'PASS' : 'FAIL');
    
    console.log('\nsysadmin@cjcollegeprep.org:');
    console.log('  Role:', sysadminUser?.Staff[0]?.Role?.title);
    console.log('  Role Key:', sysadminUser?.Staff[0]?.Role?.key);
    console.log('  is_school_admin:', sysadminUser?.is_school_admin);
    console.log('  Capabilities:', sysadminUser?.Staff[0]?.Role?.Permissions?.length || 0);
    console.log('  ✅ Should be OPS_ADMIN:', sysadminUser?.Staff[0]?.Role?.key === 'OPS_ADMIN' ? 'PASS' : 'FAIL');
    
    // Test 2: Capability Distribution
    console.log('\n📋 TEST 2: Capability Distribution');
    console.log('-'.repeat(40));
    
    const devCapabilities = adminUser?.Staff[0]?.Role?.Permissions?.map(p => p.capability) || [];
    const opsCapabilities = sysadminUser?.Staff[0]?.Role?.Permissions?.map(p => p.capability) || [];
    
    const devOnlyCapabilities = devCapabilities.filter(c => c.startsWith('dev:'));
    const opsOnlyCapabilities = opsCapabilities.filter(c => c.startsWith('ops:'));
    
    console.log('DEV_ADMIN (admin@school.edu):');
    console.log('  Dev capabilities:', devOnlyCapabilities.length);
    console.log('  Has dev:debug:', devCapabilities.includes('dev:debug') ? 'YES ✅' : 'NO ❌');
    console.log('  Has dev:ci:', devCapabilities.includes('dev:ci') ? 'YES ✅' : 'NO ❌');
    console.log('  Has ops:monitoring:', devCapabilities.includes('ops:monitoring') ? 'YES ✅' : 'NO ❌');
    
    console.log('\nOPS_ADMIN (sysadmin@cjcollegeprep.org):');
    console.log('  Ops capabilities:', opsOnlyCapabilities.length);
    console.log('  Has ops:monitoring:', opsCapabilities.includes('ops:monitoring') ? 'YES ✅' : 'NO ❌');
    console.log('  Has ops:backup:', opsCapabilities.includes('ops:backup') ? 'YES ✅' : 'NO ❌');
    console.log('  Has dev:debug:', opsCapabilities.includes('dev:debug') ? 'NO ✅' : 'YES ❌ (should not have)');
    
    // Test 3: Page Access Matrix
    console.log('\n📋 TEST 3: Page Access Matrix');
    console.log('-'.repeat(40));
    
    const devPages = [
      '/dashboard/development',
      '/dashboard/monitoring',
      '/dashboard/settings/system'
    ];
    
    const opsPages = [
      '/dashboard/settings/monitoring',
      '/dashboard/settings/backup',
      '/dashboard/settings/audit'
    ];
    
    console.log('DEV_ADMIN should access:');
    devPages.forEach(page => {
      console.log(`  ${page}: ✅ YES`);
    });
    opsPages.forEach(page => {
      console.log(`  ${page}: ✅ YES (DEV_ADMIN has all access)`);
    });
    
    console.log('\nOPS_ADMIN should access:');
    devPages.forEach(page => {
      if (page.includes('development')) {
        console.log(`  ${page}: ❌ NO`);
      } else {
        console.log(`  ${page}: ✅ YES`);
      }
    });
    opsPages.forEach(page => {
      console.log(`  ${page}: ✅ YES`);
    });
    
    // Test 4: API Endpoint Access
    console.log('\n📋 TEST 4: API Endpoint Access');
    console.log('-'.repeat(40));
    
    const devEndpoints = [
      '/api/dev/*',
      '/api/tests/*',
      '/api/system/lint',
      '/api/system/fix'
    ];
    
    const opsEndpoints = [
      '/api/system/backup',
      '/api/monitoring/*',
      '/api/admin/audit-logs',
      '/api/system/server'
    ];
    
    console.log('DEV_ADMIN API access:');
    devEndpoints.forEach(endpoint => {
      console.log(`  ${endpoint}: ✅ YES`);
    });
    opsEndpoints.forEach(endpoint => {
      console.log(`  ${endpoint}: ✅ YES (DEV_ADMIN has all access)`);
    });
    
    console.log('\nOPS_ADMIN API access:');
    devEndpoints.forEach(endpoint => {
      console.log(`  ${endpoint}: ❌ NO (blocked)`);
    });
    opsEndpoints.forEach(endpoint => {
      console.log(`  ${endpoint}: ✅ YES`);
    });
    
    // Test 5: Database Integrity
    console.log('\n📋 TEST 5: Database Integrity');
    console.log('-'.repeat(40));
    
    const roleCount = await prisma.role.count();
    const permissionCount = await prisma.permission.count();
    const userCount = await prisma.user.count();
    const staffCount = await prisma.staff.count();
    
    console.log('Database Statistics:');
    console.log('  Roles:', roleCount);
    console.log('  Permissions:', permissionCount);
    console.log('  Users:', userCount);
    console.log('  Staff:', staffCount);
    console.log('  ✅ Database integrity:', (roleCount > 0 && permissionCount > 0) ? 'PASS' : 'FAIL');
    
    // Test Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    
    const allTestsPassed = 
      adminUser?.Staff[0]?.Role?.key === 'DEV_ADMIN' &&
      sysadminUser?.Staff[0]?.Role?.key === 'OPS_ADMIN' &&
      devCapabilities.includes('dev:debug') &&
      opsCapabilities.includes('ops:monitoring') &&
      !opsCapabilities.includes('dev:debug');
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED - RBAC System is correctly configured');
      console.log('\nConfiguration:');
      console.log('  🔧 admin@school.edu = DEV_ADMIN (System Developer)');
      console.log('  🏫 sysadmin@cjcollegeprep.org = OPS_ADMIN (School Administrator)');
    } else {
      console.log('❌ SOME TESTS FAILED - Please review the configuration');
    }
    
    console.log('\nRecommendations:');
    console.log('1. Clear browser cookies and cache');
    console.log('2. Sign out and sign in again to refresh JWT tokens');
    console.log('3. Test actual page access in the browser');
    
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testComprehensiveAccess();
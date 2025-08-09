const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAdminAccess() {
  console.log('Testing admin access capabilities...\n');
  console.log('='.repeat(80));
  
  // Test admin@school.edu (OPS_ADMIN)
  const opsAdmin = await prisma.user.findUnique({
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
  
  console.log('\n📧 admin@school.edu (OPS_ADMIN):');
  console.log('-'.repeat(40));
  console.log('User ID:', opsAdmin.id);
  console.log('is_system_admin:', opsAdmin.is_system_admin);
  console.log('is_school_admin:', opsAdmin.is_school_admin);
  
  if (opsAdmin.Staff && opsAdmin.Staff[0]) {
    console.log('Role:', opsAdmin.Staff[0].Role.title);
    console.log('Role Key:', opsAdmin.Staff[0].Role.key);
    console.log('Permissions:', opsAdmin.Staff[0].Role.Permissions.length);
    
    // List capabilities
    if (opsAdmin.Staff[0].Role.Permissions.length > 0) {
      console.log('\nCapabilities:');
      opsAdmin.Staff[0].Role.Permissions.forEach(p => {
        console.log(`  - ${p.capability}`);
      });
    }
  }
  
  // Test sysadmin@cjcollegeprep.org (DEV_ADMIN)
  const devAdmin = await prisma.user.findUnique({
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
  
  console.log('\n📧 sysadmin@cjcollegeprep.org (DEV_ADMIN):');
  console.log('-'.repeat(40));
  console.log('User ID:', devAdmin.id);
  console.log('is_system_admin:', devAdmin.is_system_admin);
  console.log('is_school_admin:', devAdmin.is_school_admin);
  
  if (devAdmin.Staff && devAdmin.Staff[0]) {
    console.log('Role:', devAdmin.Staff[0].Role.title);
    console.log('Role Key:', devAdmin.Staff[0].Role.key);
    console.log('Permissions:', devAdmin.Staff[0].Role.Permissions.length);
    
    // List capabilities
    if (devAdmin.Staff[0].Role.Permissions.length > 0) {
      console.log('\nCapabilities:');
      devAdmin.Staff[0].Role.Permissions.forEach(p => {
        console.log(`  - ${p.capability}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('ACCESS SUMMARY:');
  console.log('='.repeat(80));
  
  // OPS_ADMIN should have access to:
  console.log('\n🔵 OPS_ADMIN (admin@school.edu) should access:');
  console.log('  ✓ /dashboard/system/*');
  console.log('  ✓ /dashboard/settings/*');
  console.log('  ✓ /dashboard/monitoring');
  console.log('  ✗ /dashboard/development');
  
  // DEV_ADMIN should have access to:
  console.log('\n🔴 DEV_ADMIN (sysadmin@cjcollegeprep.org) should access:');
  console.log('  ✓ ALL pages including /dashboard/development');
  
  console.log('\n' + '='.repeat(80));
  console.log('TROUBLESHOOTING:');
  console.log('='.repeat(80));
  
  if (!opsAdmin.is_school_admin) {
    console.log('❌ admin@school.edu is NOT marked as school admin!');
  }
  if (!devAdmin.is_system_admin) {
    console.log('❌ sysadmin@cjcollegeprep.org is NOT marked as system admin!');
  }
  
  if (opsAdmin.is_school_admin && devAdmin.is_system_admin) {
    console.log('✅ Admin flags are correctly set');
    console.log('\nIf access issues persist:');
    console.log('1. Clear browser cookies and cache');
    console.log('2. Sign out and sign in again');
    console.log('3. Check that session is being refreshed with new flags');
  }
  
  process.exit(0);
}

testAdminAccess().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
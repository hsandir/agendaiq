const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRoles() {
  console.log('Fixing admin role assignments...\n');
  console.log('='.repeat(80));
  
  try {
    // Fix admin@school.edu - should be DEV_ADMIN (system developer)
    console.log('\n📧 Fixing admin@school.edu to be DEV_ADMIN (System Developer)...');
    
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    if (adminUser) {
      // Update user flags
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          is_system_admin: true,  // DEV_ADMIN should be system admin
          is_school_admin: false   // Not school admin
        }
      });
      
      // Find DEV_ADMIN role
      const devAdminRole = await prisma.role.findUnique({
        where: { key: 'DEV_ADMIN' }
      });
      
      if (devAdminRole && adminUser.Staff[0]) {
        // Update staff role
        await prisma.staff.update({
          where: { id: adminUser.Staff[0].id },
          data: {
            role_id: devAdminRole.id
          }
        });
        console.log('✅ admin@school.edu updated to DEV_ADMIN');
      }
    }
    
    // Fix sysadmin@cjcollegeprep.org - should be OPS_ADMIN (school administrator)
    console.log('\n📧 Fixing sysadmin@cjcollegeprep.org to be OPS_ADMIN (School Administrator)...');
    
    const sysadminUser = await prisma.user.findUnique({
      where: { email: 'sysadmin@cjcollegeprep.org' },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    if (sysadminUser) {
      // Update user flags
      await prisma.user.update({
        where: { id: sysadminUser.id },
        data: {
          is_system_admin: false,  // OPS_ADMIN is not system admin
          is_school_admin: true    // But is school admin
        }
      });
      
      // Find OPS_ADMIN role
      const opsAdminRole = await prisma.role.findUnique({
        where: { key: 'OPS_ADMIN' }
      });
      
      if (opsAdminRole && sysadminUser.Staff[0]) {
        // Update staff role
        await prisma.staff.update({
          where: { id: sysadminUser.Staff[0].id },
          data: {
            role_id: opsAdminRole.id
          }
        });
        console.log('✅ sysadmin@cjcollegeprep.org updated to OPS_ADMIN');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION:');
    console.log('='.repeat(80));
    
    // Verify the changes
    const verifyAdmin = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    const verifySysadmin = await prisma.user.findUnique({
      where: { email: 'sysadmin@cjcollegeprep.org' },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    console.log('\n✅ admin@school.edu:');
    console.log('   Role:', verifyAdmin?.Staff[0]?.Role?.title);
    console.log('   Role Key:', verifyAdmin?.Staff[0]?.Role?.key);
    console.log('   is_system_admin:', verifyAdmin?.is_system_admin);
    console.log('   is_school_admin:', verifyAdmin?.is_school_admin);
    
    console.log('\n✅ sysadmin@cjcollegeprep.org:');
    console.log('   Role:', verifySysadmin?.Staff[0]?.Role?.title);
    console.log('   Role Key:', verifySysadmin?.Staff[0]?.Role?.key);
    console.log('   is_system_admin:', verifySysadmin?.is_system_admin);
    console.log('   is_school_admin:', verifySysadmin?.is_school_admin);
    
    console.log('\n' + '='.repeat(80));
    console.log('CORRECT SETUP:');
    console.log('='.repeat(80));
    console.log('🔧 admin@school.edu = DEV_ADMIN (System Developer) - Can access /dashboard/development');
    console.log('🏫 sysadmin@cjcollegeprep.org = OPS_ADMIN (School Administrator) - Manages school operations');
    
  } catch (error) {
    console.error('Error fixing admin roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRoles();
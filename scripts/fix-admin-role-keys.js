const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRoleKeys() {
  console.log('🔧 Fixing admin role keys for proper authorization...\n');
  
  try {
    // 1. Update System Administrator role to have OPS_ADMIN key
    const sysAdminRole = await prisma.role.findFirst({
      where: { title: 'System Administrator' }
    });
    
    if (sysAdminRole) {
      await prisma.role.update({
        where: { id: sysAdminRole.id },
        data: {
          key: 'OPS_ADMIN',
          priority: 1,
          is_leadership: true
        }
      });
      console.log('✅ Updated System Administrator role with OPS_ADMIN key');
    }
    
    // 2. Create or update DEV_ADMIN role for development admin
    let devAdminRole = await prisma.role.findFirst({
      where: { OR: [
        { key: 'DEV_ADMIN' },
        { title: 'Development Admin' }
      ]}
    });
    
    if (!devAdminRole) {
      // Create DEV_ADMIN role
      devAdminRole = await prisma.role.create({
        data: {
          key: 'DEV_ADMIN',
          title: 'Development Admin',
          priority: 0,
          is_leadership: true,
          is_supervisor: true,
          category: 'ADMIN'
        }
      });
      console.log('✅ Created Development Admin role with DEV_ADMIN key');
    } else {
      // Update existing role
      await prisma.role.update({
        where: { id: devAdminRole.id },
        data: {
          key: 'DEV_ADMIN',
          title: 'Development Admin',
          priority: 0,
          is_leadership: true
        }
      });
      console.log('✅ Updated Development Admin role with DEV_ADMIN key');
    }
    
    // 3. Update admin@school.edu staff to use DEV_ADMIN role
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: { Staff: true }
    });
    
    if (adminUser && adminUser.Staff[0]) {
      await prisma.staff.update({
        where: { id: adminUser.Staff[0].id },
        data: {
          role_id: devAdminRole.id
        }
      });
      console.log('✅ Updated admin@school.edu to use DEV_ADMIN role');
    }
    
    // 4. Update sysadmin@cjcollegeprep.org staff to use OPS_ADMIN role
    const sysadminUser = await prisma.user.findUnique({
      where: { email: 'sysadmin@cjcollegeprep.org' },
      include: { Staff: true }
    });
    
    if (sysadminUser && sysadminUser.Staff[0] && sysAdminRole) {
      await prisma.staff.update({
        where: { id: sysadminUser.Staff[0].id },
        data: {
          role_id: sysAdminRole.id
        }
      });
      console.log('✅ Updated sysadmin@cjcollegeprep.org to use OPS_ADMIN role');
    }
    
    // 5. Verify the changes
    console.log('\n📊 Verification:');
    console.log('='.repeat(50));
    
    const admins = await prisma.user.findMany({
      where: {
        email: { in: ['admin@school.edu', 'sysadmin@cjcollegeprep.org'] }
      },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    for (const admin of admins) {
      console.log(`\n${admin.email}:`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  System Admin: ${admin.is_system_admin ? '✅' : '❌'}`);
      console.log(`  School Admin: ${admin.is_school_admin ? '✅' : '❌'}`);
      if (admin.Staff[0]) {
        console.log(`  Role: ${admin.Staff[0].Role.title}`);
        console.log(`  Role Key: ${admin.Staff[0].Role.key || 'NOT SET'}`);
        console.log(`  Priority: ${admin.Staff[0].Role.priority}`);
      }
    }
    
    // 6. List all capabilities for each role
    console.log('\n📋 Role Capabilities:');
    console.log('='.repeat(50));
    
    console.log('\nDEV_ADMIN Capabilities:');
    console.log('  - Full system access');
    console.log('  - Development tools');
    console.log('  - CI/CD operations');
    console.log('  - Database management');
    console.log('  - Mock data management');
    console.log('  - System updates');
    
    console.log('\nOPS_ADMIN Capabilities:');
    console.log('  - School administration');
    console.log('  - User management');
    console.log('  - Role management');
    console.log('  - Meeting management');
    console.log('  - Staff management');
    console.log('  - Monitoring and logs');
    
    console.log('\n✨ Admin role keys fixed successfully!');
    console.log('\nLogin Credentials:');
    console.log('  Development Admin: admin@school.edu / 1234');
    console.log('  School Admin: sysadmin@cjcollegeprep.org / Admin123!@#');
    
  } catch (error) {
    console.error('❌ Error fixing admin role keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRoleKeys().catch(console.error);
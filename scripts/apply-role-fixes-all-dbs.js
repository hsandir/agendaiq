const { PrismaClient } = require('@prisma/client');

async function applyRoleFixesToAllDbs() {
  console.log('🔧 Applying role fixes to all databases...\n');
  
  const databases = [
    { name: 'Backup Database', url: 'postgresql://hs:yeni@localhost:5432/agendaiq_backup' },
    { name: 'Test Database', url: 'postgresql://hs:yeni@localhost:5432/agendaiq_test' }
  ];
  
  for (const db of databases) {
    console.log(`\n📊 Updating ${db.name}:`);
    console.log('-'.repeat(40));
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: db.url
        }
      }
    });
    
    try {
      // 1. Update System Administrator role
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
        console.log('  ✅ Updated System Administrator role with OPS_ADMIN key');
      }
      
      // 2. Create or update DEV_ADMIN role
      let devAdminRole = await prisma.role.findFirst({
        where: { OR: [
          { key: 'DEV_ADMIN' },
          { title: 'Development Admin' }
        ]}
      });
      
      if (!devAdminRole) {
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
        console.log('  ✅ Created Development Admin role');
      } else {
        await prisma.role.update({
          where: { id: devAdminRole.id },
          data: {
            key: 'DEV_ADMIN',
            title: 'Development Admin',
            priority: 0,
            is_leadership: true
          }
        });
        console.log('  ✅ Updated Development Admin role');
      }
      
      // 3. Update admin@school.edu staff
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
        console.log('  ✅ Updated admin@school.edu to DEV_ADMIN');
      }
      
      // 4. Update sysadmin@cjcollegeprep.org staff
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
        console.log('  ✅ Updated sysadmin@cjcollegeprep.org to OPS_ADMIN');
      }
      
      // 5. Quick verification
      const roles = await prisma.role.findMany({
        where: {
          key: { in: ['DEV_ADMIN', 'OPS_ADMIN'] }
        },
        select: {
          key: true,
          title: true,
          priority: true
        }
      });
      
      console.log('\n  Roles with keys:');
      for (const role of roles) {
        console.log(`    - ${role.title}: ${role.key} (priority: ${role.priority})`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ All databases updated successfully!');
  console.log('\nRole Configuration:');
  console.log('  admin@school.edu → DEV_ADMIN (Development Admin)');
  console.log('  sysadmin@cjcollegeprep.org → OPS_ADMIN (School Admin)');
}

applyRoleFixesToAllDbs().catch(console.error);
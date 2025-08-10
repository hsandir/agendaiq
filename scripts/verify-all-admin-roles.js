const { PrismaClient } = require('@prisma/client');

async function verifyAllAdminRoles() {
  console.log('🔍 Verifying admin roles across all databases...\n');
  console.log('='.repeat(60));
  
  const databases = [
    { name: 'Main Database', url: 'postgresql://hs:yeni@localhost:5432/agendaiq' },
    { name: 'Backup Database', url: 'postgresql://hs:yeni@localhost:5432/agendaiq_backup' },
    { name: 'Test Database', url: 'postgresql://hs:yeni@localhost:5432/agendaiq_test' }
  ];
  
  for (const db of databases) {
    console.log(`\n📊 ${db.name}:`);
    console.log('-'.repeat(40));
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: db.url
        }
      }
    });
    
    try {
      const admins = await prisma.user.findMany({
        where: {
          email: {
            in: ['admin@school.edu', 'sysadmin@cjcollegeprep.org']
          }
        },
        select: {
          email: true,
          name: true,
          is_system_admin: true,
          is_school_admin: true,
          Staff: {
            select: {
              Role: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          email: 'asc'
        }
      });
      
      if (admins.length === 0) {
        console.log('  ⚠️ No admin users found');
      } else {
        for (const admin of admins) {
          console.log(`\n  ${admin.email}:`);
          console.log(`    Name: ${admin.name}`);
          console.log(`    System Admin: ${admin.is_system_admin ? '✅ YES' : '❌ NO'}`);
          console.log(`    School Admin: ${admin.is_school_admin ? '✅ YES' : '❌ NO'}`);
          if (admin.Staff && admin.Staff[0]) {
            console.log(`    Staff Role: ${admin.Staff[0].Role.title}`);
          }
        }
      }
      
      // Count total users
      const totalUsers = await prisma.user.count();
      const totalRoles = await prisma.role.count();
      const totalHierarchy = await prisma.roleHierarchy.count();
      
      console.log(`\n  📈 Statistics:`);
      console.log(`    Total Users: ${totalUsers}`);
      console.log(`    Total Roles: ${totalRoles}`);
      console.log(`    Role Hierarchies: ${totalHierarchy}`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Verification complete!\n');
  
  console.log('Expected Configuration:');
  console.log('  admin@school.edu:');
  console.log('    - Development System Administrator');
  console.log('    - System Admin: ✅ YES');
  console.log('    - School Admin: ❌ NO');
  console.log('\n  sysadmin@cjcollegeprep.org:');
  console.log('    - School Administrator Only');
  console.log('    - System Admin: ❌ NO');
  console.log('    - School Admin: ✅ YES');
}

verifyAllAdminRoles().catch(console.error);
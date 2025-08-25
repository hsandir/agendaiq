const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixAdmins() {
  console.log('Checking admin users status...\n');
  
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@school.edu', 'sysadmin@cjcollegeprep.org']
      }
    },
    include: {
      Staff: {
        include: {
          Role: true
        }
      }
    }
  });
  
  console.log('Current admin users:');
  console.log('==================');
  
  for (const user of users) {
    console.log(`
Email: ${user.email}
ID: ${user.id}
is_system_admin: ${user.is_system_admin}
is_school_admin: ${user.is_school_admin}
Staff: ${user.Staff.length > 0 ? user.Staff[0].Role.title + ' (key: ' + user.Staff[0].Role.key + ')' : 'No staff record'}
    `);
    
    // Fix admin flags based on email
    if (user.email === 'admin@school.edu') {
      // This should be OPS_ADMIN (school admin)
      if (!user.is_school_admin) {
        console.log(`Fixing ${user.email} - setting is_school_admin = true`);
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            is_school_admin: true,
            is_system_admin: false // Make sure it's not system admin
          }
        });
      }
    } else if (user.email === 'sysadmin@cjcollegeprep.org') {
      // This should be system admin
      if (!user.is_system_admin) {
        console.log(`Fixing ${user.email} - setting is_system_admin = true`);
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            is_system_admin: true,
            is_school_admin: false
          }
        });
      }
    }
  }
  
  // Also check dev@agendaiq.com if exists
  const devUser = await prisma.user.findUnique({
    where: { email: 'dev@agendaiq.com' },
    include: {
      Staff: {
        include: {
          Role: true
        }
      }
    }
  });
  
  if (devUser) {
    console.log(`
Dev User:
Email: ${devUser.email}
ID: ${devUser.id}
is_system_admin: ${devUser.is_system_admin}
is_school_admin: ${devUser.is_school_admin}
Staff: ${devUser.Staff.length > 0 ? devUser.Staff[0].Role.title : 'No staff record'}
    `);
    
    // Dev user should be system admin
    if (!devUser.is_system_admin) {
      console.log(`Fixing ${devUser.email} - setting is_system_admin = true`);
      await prisma.user.update({
        where: { id: devUser.id },
        data: { is_system_admin: true, is_school_admin: false }
      });
    }
  }
  
  // Check permissions
  const permissions = await prisma.permission.count();
  console.log(`\nTotal permissions in database: ${permissions}`);
  
  // Check roles with OPS_ADMIN and DEV_ADMIN keys
  const adminRoles = await prisma.role.findMany({
    where: {
      key: {
        in: ['OPS_ADMIN', 'DEV_ADMIN']
      }
    },
    include: {
      Permissions: true
    }
  });
  
  console.log('\nAdmin roles with permissions:');
  adminRoles.forEach(role => {
    console.log(`- ${role.title} (${role.key}): ${role.Permissions.length} permissions`);
  });
  
  // Update role keys if needed
  const adminRole = await prisma.role.findFirst({
    where: { title: 'Administrator' }
  });
  
  if (adminRole && !adminRole.key) {
    console.log('\nUpdating Administrator role to have OPS_ADMIN key...');
    await prisma.role.update({
      where: { id: adminRole.id },
      data: { key: 'OPS_ADMIN' }
    });
  }
  
  console.log('\n✅ Admin check and fix completed!');
  process.exit(0);
}

checkAndFixAdmins().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
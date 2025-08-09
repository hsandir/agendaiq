const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemAdmin() {
  try {
    // Find System Administrator role
    const sysAdminRole = await prisma.role.findFirst({
      where: { title: 'System Administrator' },
      include: {
        Staff: {
          include: {
            User: true
          }
        }
      }
    });
    
    if (sysAdminRole) {
      console.log('System Administrator role found:');
      console.log('- Priority:', sysAdminRole.priority);
      console.log('- Is Leadership:', sysAdminRole.is_leadership);
      console.log('- Level:', sysAdminRole.level);
      console.log('- Staff:', sysAdminRole.Staff.map(s => s.User.email).join(', '));
    }
    
    // Compare with Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (adminRole) {
      console.log('\nAdministrator role:');
      console.log('- Priority:', adminRole.priority);
      console.log('- Is Leadership:', adminRole.is_leadership);
      console.log('- Level:', adminRole.level);
    }
    
    // List all admin users
    const adminUsers = await prisma.user.findMany({
      where: { is_admin: true },
      select: { email: true, name: true }
    });
    
    console.log('\nAll is_admin=true users:');
    adminUsers.forEach(u => console.log('- ' + u.email));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemAdmin();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminPriority() {
  try {
    // Find Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (!adminRole) {
      console.log('Administrator role not found!');
      return;
    }
    
    console.log('Current Administrator role:');
    console.log('- Priority:', adminRole.priority);
    console.log('- Level:', adminRole.level);
    
    // Update to priority 0 and level 0
    const updatedRole = await prisma.role.update({
      where: { id: adminRole.id },
      data: {
        priority: 0,
        level: 0
      }
    });
    
    console.log('\nUpdated Administrator role:');
    console.log('- Priority:', updatedRole.priority);
    console.log('- Level:', updatedRole.level);
    
    // Compare with System Administrator
    const sysAdminRole = await prisma.role.findFirst({
      where: { title: 'System Administrator' }
    });
    
    if (sysAdminRole) {
      console.log('\nSystem Administrator role (for comparison):');
      console.log('- Priority:', sysAdminRole.priority);
      console.log('- Level:', sysAdminRole.level);
    }
    
    // Verify admin user still works
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
    
    console.log('\nAdmin user verification:');
    console.log('- Email:', adminUser.email);
    console.log('- Role:', adminUser.Staff[0]?.Role.title);
    console.log('- Role Priority:', adminUser.Staff[0]?.Role.priority);
    console.log('- Role Level:', adminUser.Staff[0]?.Role.level);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPriority();
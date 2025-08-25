const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRole() {
  try {
    // 1. Find Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (!adminRole) {
      console.error('Administrator role not found!');
      return;
    }
    
    console.log('Found Administrator role:', adminRole.id);
    
    // 2. Update admin@school.edu staff record
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: { Staff: true }
    });
    
    if (!adminUser) {
      console.error('admin@school.edu not found!');
      return;
    }
    
    if (!adminUser.Staff) {
      console.error('admin@school.edu has no staff record!');
      return;
    }
    
    // 3. Update staff record with Administrator role
    const updated = await prisma.staff.update({
      where: { id: adminUser.Staff.id },
      data: {
        role_id: adminRole.id
      },
      include: {
        Role: true,
        User: true
      }
    });
    
    console.log('\n✅ Successfully updated admin@school.edu:');
    console.log('- User:', updated.User.email);
    console.log('- Role:', updated.Role?.title);
    console.log('- Role Priority:', updated.Role?.priority);
    console.log('- Role Level:', updated.Role?.level);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRole();
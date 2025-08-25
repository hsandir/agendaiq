const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  const roles = await prisma.role.findMany({
    where: { 
      OR: [
        { title: 'Administrator' },
        { title: 'System Administrator' }
      ]
    },
    include: {
      Staff: {
        include: {
          User: true
        }
      }
    }
  });
  
  console.log('=== EXISTING ROLES ===');
  roles.forEach(role => {
    console.log(`Title: ${role.title}`);
    console.log(`Priority: ${role.priority}, Level: ${role.level}`);
    console.log(`Staff count: ${role.Staff.length}`);
    if (role.Staff.length > 0) {
      console.log('Users with this role:');
      role.Staff.forEach(s => console.log(`  - ${s.User.email}`));
    }
    console.log('---');
  });
  
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
  
  console.log('\n=== ADMIN USER STATUS ===');
  console.log(`Email: ${adminUser?.email}`);
  console.log(`is_admin flag: ${adminUser?.is_admin}`);
  console.log(`Has staff record: ${adminUser?.Staff ? 'Yes' : 'No'}`);
  if (adminUser?.Staff) {
    console.log(`Staff role: ${adminUser.Staff.Role?.title || 'No role'}`);
    console.log(`Role priority: ${adminUser.Staff.Role?.priority}`);
    console.log(`Role level: ${adminUser.Staff.Role?.level}`);
  }
}

checkRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
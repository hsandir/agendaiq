const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getData() {
  try {
    const users = await prisma.user.findMany({
      include: { Staff: { include: { Role: true, Department: true } } }
    });
    
    const roles = await prisma.role.findMany({ include: { Department: true } });
    const departments = await prisma.department.findMany();
    
    console.log('=== EXISTING USERS ===');
    users.forEach(user => {
      const staff = user.Staff[0];
      console.log(`${user.email} | ${user.name} | StaffID: ${user.staff_id || 'NO_ID'} | ${staff?.Role?.title || 'NO_ROLE'} | ${staff?.Department?.name || 'NO_DEPT'} | Leadership: ${staff?.Role?.is_leadership || false}`);
    });
    
    console.log('\n=== AVAILABLE ROLES ===');
    roles.forEach(role => {
      console.log(`${role.title} | Priority: ${role.priority} | Leadership: ${role.is_leadership} | Dept: ${role.Department?.name || 'No Dept'}`);
    });
    
    console.log('\n=== AVAILABLE DEPARTMENTS ===');
    departments.forEach(dept => {
      console.log(`${dept.name} | Code: ${dept.code}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getData(); 
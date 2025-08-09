const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, title: true }
    });
    console.log('Roles:', roles.map(r => r.title).join(', '));
    
    const departments = await prisma.department.findMany({
      select: { id: true, name: true }
    });
    console.log('Departments:', departments.map(d => d.name).join(', '));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check existing roles
    const roles = await prisma.role.findMany();
    console.log('Existing roles:', roles);
    
    // Check existing users
    const users = await prisma.user.findMany();
    console.log('\nExisting users:', users);
    
    // Check existing districts
    const districts = await prisma.district.findMany();
    console.log('\nExisting districts:', districts);
    
    // Check existing schools
    const schools = await prisma.school.findMany();
    console.log('\nExisting schools:', schools);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
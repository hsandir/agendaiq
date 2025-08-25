const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true,
            District: true
          }
        }
      }
    });
    
    if (adminUser) {
      console.log('Admin user found:');
      console.log('ID:', adminUser.id);
      console.log('Email:', adminUser.email);
      console.log('Name:', adminUser.name);
      console.log('Has password:', Boolean(adminUser.hashedPassword));
      console.log('Staff record:', adminUser.Staff.length > 0 ? 'Yes' : 'No');
      if (adminUser.Staff[0]) {
        console.log('Staff Role:', adminUser.Staff[0].Role.title);
        console.log('Is Leadership:', adminUser.Staff[0].Role.is_leadership);
        console.log('Department:', adminUser.Staff[0].Department.name);
        console.log('School:', adminUser.Staff[0].School.name);
        console.log('District:', adminUser.Staff[0].District.name);
      }
    } else {
      console.log('Admin user not found');
      
      // List all users
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
      });
      console.log('\nAll users in database:');
      allUsers.forEach(u => console.log('- ' + u.email));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Update the CEO user (sercan@cjcp.edu) with a password
    const adminUser = await prisma.user.update({
      where: { email: 'sercan@cjcp.edu' },
      data: {
        hashedPassword: hashedPassword,
      },
    });

    console.log('✅ Password added successfully:');
    console.log('Email: sercan@cjcp.edu');
    console.log('Password: password');
    console.log('Role: Chief Education Officer (CEO)');
    
    // Also create a simple admin user for testing
    const testAdmin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {
        hashedPassword: hashedPassword,
      },
      create: {
        email: 'admin@test.com',
        name: 'Test Admin',
        hashedPassword: hashedPassword,
        emailVerified: new Date(),
      },
    });

    // Create staff record for test admin if it doesn't exist
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Chief Education Officer (CEO)' }
    });

    if (adminRole) {
      await prisma.staff.upsert({
        where: { user_id: testAdmin.id },
        update: {},
        create: {
          user_id: testAdmin.id,
          role_id: adminRole.id,
          department_id: 1, // CEO's Office
          school_id: 1,
          district_id: 1,
        },
      });
    }

    console.log('\n✅ Test admin user created:');
    console.log('Email: admin@test.com');
    console.log('Password: password');
    
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
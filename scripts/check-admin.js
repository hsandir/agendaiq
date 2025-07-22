const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('Checking admin user...');

    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true
          }
        }
      }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('Email:', adminUser.email);
    console.log('Name:', adminUser.name);
    console.log('Staff ID:', adminUser.staff_id);
    console.log('Has hashed password:', !!adminUser.hashedPassword);
    
    if (adminUser.Staff && adminUser.Staff.length > 0) {
      const staff = adminUser.Staff[0];
      console.log('Role:', staff.Role?.title || 'No role');
      console.log('Department:', staff.Department?.name || 'No department');
    }

    // Test password "1234"
    if (adminUser.hashedPassword) {
      const isValid = await bcrypt.compare('1234', adminUser.hashedPassword);
      console.log('Password "1234" is valid:', isValid);
      
      if (!isValid) {
        console.log('❌ Password "1234" is not valid!');
        console.log('Hash:', adminUser.hashedPassword);
      } else {
        console.log('✅ Password "1234" is valid!');
      }
    }

  } catch (error) {
    console.error('Error checking admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin(); 
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });

    if (existingUser) {
      console.log('Admin user already exists!');
      return;
    }

    // Create or find the Administrator role
    let role = await prisma.role.findFirst({
      where: { name: 'Administrator' }
    });

    if (!role) {
      role = await prisma.role.create({
        data: { name: 'Administrator' }
      });
      console.log('Created Administrator role');
    }

    // Create or find the Administration department
    let department = await prisma.department.findFirst({
      where: { name: 'Administration' }
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          name: 'Administration',
          code: 'ADMIN'
        }
      });
      console.log('Created Administration department');
    }

    // Hash password "1234"
    const hashedPassword = await bcrypt.hash('1234', 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: 'admin@school.edu',
        name: 'System Administrator',
        staffId: `ADMIN-${Date.now()}`,
        hashedPassword,
        roleId: role.id,
        departmentId: department.id
      }
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@school.edu');
    console.log('Password: 1234');
    console.log('Staff ID:', user.staffId);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 
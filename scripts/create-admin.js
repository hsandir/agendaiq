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
      where: { title: 'Administrator' }
    });

    if (!role) {
      role = await prisma.role.create({
        data: { 
          title: 'Administrator',
          priority: 1,
          is_leadership: true
        }
      });
      console.log('Created Administrator role');
    }

    // Get the first school and district
    const district = await prisma.district.findFirst();
    const school = await prisma.school.findFirst();
    
    if (!district || !school) {
      console.error('No district or school found. Please run seed script first.');
      return;
    }

    // Create or find the Administration department
    let department = await prisma.department.findFirst({
      where: { name: 'Administration' }
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          name: 'Administration',
          code: 'ADMIN',
          school_id: school.id
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
        staff_id: `ADMIN-${Date.now()}`,
        hashedPassword,
        is_admin: true,
        emailVerified: new Date()
      }
    });
    
    // Create staff record
    const staff = await prisma.staff.create({
      data: {
        user_id: user.id,
        role_id: role.id,
        department_id: department.id,
        school_id: school.id,
        district_id: district.id
      }
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@school.edu');
    console.log('Password: 1234');
    console.log('Staff ID:', user.staff_id);
    console.log('User ID:', user.id);
    console.log('Staff Record ID:', staff.id);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 
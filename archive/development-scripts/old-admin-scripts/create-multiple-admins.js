const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createMultipleAdmins() {
  try {
    console.log('Creating multiple admin users...');

    // Find or create the Administrator role
    let role = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });

    if (!role) {
      role = await prisma.role.create({
        data: { 
          title: 'Administrator',
          priority: 0,
          category: 'Administration'
        }
      });
      console.log('Created Administrator role');
    }

    // Find or create the Administration department
    let department = await prisma.department.findFirst({
      where: { name: 'Administration' }
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          name: 'Administration',
          code: 'ADMIN',
          category: 'Administration'
        }
      });
      console.log('Created Administration department');
    }

    // Find or create a school and district
    let district = await prisma.district.findFirst();
    if (!district) {
      district = await prisma.district.create({
        data: {
          name: 'Main District',
          code: 'MAIN'
        }
      });
    }

    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'Main School',
          code: 'MAIN',
          district_id: district.id
        }
      });
    }

    // Update department with school_id if needed
    if (!department.school_id) {
      await prisma.department.update({
        where: { id: department.id },
        data: { school_id: school.id }
      });
    }

    // Update role with department_id if needed
    if (!role.department_id) {
      await prisma.role.update({
        where: { id: role.id },
        data: { department_id: department.id }
      });
    }

    // Admin users to create
    const adminUsers = [
      {
        email: 'admin@school.edu',
        name: 'System Administrator',
        password: '1234'
      },
      {
        email: 'principal@school.edu',
        name: 'School Principal',
        password: '1234'
      },
      {
        email: 'director@school.edu',
        name: 'School Director',
        password: '1234'
      }
    ];

    for (const adminData of adminUsers) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: adminData.email }
      });

      if (!user) {
        // Create new user
        const hashedPassword = await bcrypt.hash(adminData.password, 12);
        user = await prisma.user.create({
          data: {
            email: adminData.email,
            name: adminData.name,
            staff_id: `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            hashedPassword: hashedPassword,
            emailVerified: new Date()
          }
        });
        console.log(`Created user: ${adminData.email}`);
      } else {
        console.log(`User already exists: ${adminData.email}`);
      }

      // Check if staff record exists
      const existingStaff = await prisma.staff.findFirst({
        where: {
          user_id: user.id,
          role_id: role.id
        }
      });

      if (!existingStaff) {
        // Create staff record
        await prisma.staff.create({
          data: {
            user_id: user.id,
            department_id: department.id,
            role_id: role.id,
            school_id: school.id,
            district_id: district.id,
            flags: ['admin'],
            endorsements: []
          }
        });
        console.log(`Created staff record for: ${adminData.email}`);
      } else {
        console.log(`Staff record already exists for: ${adminData.email}`);
      }
    }

    console.log('✅ Multiple admin users created successfully!');
    console.log('Admin users:');
    for (const adminData of adminUsers) {
      console.log(`- ${adminData.name} (${adminData.email}) - Password: ${adminData.password}`);
    }

  } catch (error) {
    console.error('Error creating multiple admins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMultipleAdmins(); 
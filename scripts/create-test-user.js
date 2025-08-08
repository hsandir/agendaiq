const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create roles first
    const adminRole = await prisma.role.upsert({
      where: { title: 'Administrator' },
      update: {},
      create: {
        title: 'Administrator',
        priority: 1,
        category: 'ADMIN',
        is_leadership: true,
      },
    });

    const teacherRole = await prisma.role.upsert({
      where: { title: 'Teacher' },
      update: {},
      create: {
        title: 'Teacher',
        priority: 6,
        category: 'STAFF',
        is_leadership: false,
      },
    });

    // Create district
    const district = await prisma.district.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Test District',
        code: 'TD001',
      },
    });

    // Create school
    const school = await prisma.school.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Test School',
        code: 'TS001',
        district_id: district.id,
      },
    });

    // Create department
    const department = await prisma.department.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Administration',
        code: 'ADMIN',
        school_id: school.id,
      },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        name: 'Admin User',
        hashedPassword: hashedPassword,
      },
    });

    // Create staff record for admin
    await prisma.staff.upsert({
      where: { user_id: adminUser.id },
      update: {},
      create: {
        user_id: adminUser.id,
        role_id: adminRole.id,
        department_id: department.id,
        school_id: school.id,
        district_id: district.id,
      },
    });

    // Create teacher user
    const teacherUser = await prisma.user.upsert({
      where: { email: 'teacher@test.com' },
      update: {},
      create: {
        email: 'teacher@test.com',
        name: 'Teacher User',
        hashedPassword: hashedPassword,
      },
    });

    // Create staff record for teacher
    await prisma.staff.upsert({
      where: { user_id: teacherUser.id },
      update: {},
      create: {
        user_id: teacherUser.id,
        role_id: teacherRole.id,
        department_id: department.id,
        school_id: school.id,
        district_id: district.id,
      },
    });

    console.log('✅ Test users created successfully:');
    console.log('Admin: admin@test.com / password');
    console.log('Teacher: teacher@test.com / password');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
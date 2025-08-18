import { prisma } from './prisma';

export async function initializeTestData() {
  try {
    // Create district
    let district = await prisma.district.findFirst({
      where: { name: 'Central Jersey College Prep Charter School' }
    });
    
    if (!district) {
      district = await prisma.district.create({
        data: {
          name: 'Central Jersey College Prep Charter School',
          code: 'CJCPCS'
        },
      });
    }

    // Create school
    const existingSchool = await prisma.school.findFirst({
      where: { 
        name: 'Central Jersey College Prep Charter School',
        district_id: district.id
      }
    });

    const school = existingSchool || await prisma.school.create({
      data: {
        name: 'Central Jersey College Prep Charter School',
        address: '101 Mettlers Road',
        code: 'CJCPCS-MAIN',
        district_id: district.id,
      },
    });

    // Get roles
    const adminRole = await prisma.role.findFirst({ where: { title: 'Administrator' } });
    const deptHeadRole = await prisma.role.findFirst({ where: { title: 'Department Head' } });
    const teacherRole = await prisma.role.findFirst({ where: { title: 'Teacher' } });

    if (!adminRole || !deptHeadRole || !teacherRole) {
      throw new Error('Required roles not found. Please run initializeRoles() first.');
    }

    // Create departments
    const departments = [
      { name: 'STEM', code: 'STEM' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Science', code: 'SCI' },
      { name: 'English', code: 'ENG' },
      { name: 'History', code: 'HIST' },
    ];

    const createdDepartments: Record<string, unknown>[] = [];
    for (const dept of departments) {
      const department = await prisma.department.upsert({
        where: { code: dept.code },
        update: {},
        create: {
          name: dept.name,
          code: dept.code,
          school_id: school.id,
        },
      });
      createdDepartments.push(department);
    }

    // Create test users with different roles
    const users = [
      {
        email: 'admin@cjcollegeprep.org',
        name: 'Admin User',
        roleId: adminRole.id,
        departmentId: createdDepartments[0].id, // STEM
      },
      {
        email: 'stem.chair@cjcollegeprep.org',
        name: 'STEM Department Chair',
        roleId: deptHeadRole.id,
        departmentId: createdDepartments[0].id, // STEM
      },
      {
        email: 'math.chair@cjcollegeprep.org',
        name: 'Math Department Chair',
        roleId: deptHeadRole.id,
        departmentId: createdDepartments[1].id, // Math
      },
      {
        email: 'science.chair@cjcollegeprep.org',
        name: 'Science Department Chair',
        roleId: deptHeadRole.id,
        departmentId: createdDepartments[2].id, // Science
      },
      {
        email: 'math.teacher@cjcollegeprep.org',
        name: 'Math Teacher',
        roleId: teacherRole.id,
        departmentId: createdDepartments[1].id, // Math
      },
      {
        email: 'science.teacher@cjcollegeprep.org',
        name: 'Science Teacher',
        roleId: teacherRole.id,
        departmentId: createdDepartments[2].id, // Science
      },
    ];

    for (const userData of users) {
      // Create user
      const user = await prisma.(user as Record<string, unknown>).upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          name: userData.name,
          hashedPassword: '$2b$10$xvCqgBtCYhHCg1aG7UYu6.6cuzckuI9E0JQH3vMXrH.kLWCVF5/OW', // password: "password"
        },
      });

      // Create staff record
      const existingStaff = await prisma.staff.findFirst({
        where: { user_id: user.id }
      });
      
      if (!existingStaff) {
        await prisma.staff.create({
          data: {
            user_id: user.id,
            role_id: parseInt(userData).roleId,
            department_id: parseInt(userData).departmentId,
            school_id: school.id,
            district_id: district.id,
          },
        });
      }
    }

    console.log('Test data initialized successfully');
    return { district, school, departments: createdDepartments };
  } catch (error: unknown) {
    console.error('Error initializing test data:', error);
    throw error;
  }
} 
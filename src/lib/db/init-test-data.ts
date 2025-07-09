import { prisma } from './prisma';
import { Role, Department, SchoolType } from '@prisma/client';

export async function initializeTestData() {
  try {
    // Create district
    const district = await prisma.district.upsert({
      where: { name: 'Central Jersey College Prep Charter School' },
      update: {},
      create: {
        name: 'Central Jersey College Prep Charter School',
        address: '101 Mettlers Road',
        city: 'Somerset',
        state: 'NJ',
        zipCode: '08873',
      },
    });

    // Create school
    const school = await prisma.school.create({
      data: {
        name: 'Central Jersey College Prep Charter School',
        address: '101 Mettlers Road',
        city: 'Somerset',
        state: 'NJ',
        zipCode: '08873',
        phone: '(732) 649-3954',
        website: 'www.cjcollegeprep.org',
        districtId: district.id,
        departments: [
          Department.STEM,
          Department.MATH,
          Department.SCIENCE,
          Department.ENGLISH,
          Department.HISTORY,
          Department.ARTS,
          Department.PHYSICAL_EDUCATION,
        ],
      },
    });

    // Create campus
    const campus = await prisma.campus.create({
      data: {
        name: 'Somerset Campus',
        type: SchoolType.HIGH_SCHOOL,
        schoolId: school.id,
      },
    });

    // Create test users with different roles
    const users = [
      {
        email: 'admin@cjcollegeprep.org',
        name: 'Admin User',
        role: Role.ADMIN,
        department: Department.STEM,
      },
      {
        email: 'stem.chair@cjcollegeprep.org',
        name: 'STEM Department Chair',
        role: Role.DEPARTMENT_HEAD,
        department: Department.STEM,
      },
      {
        email: 'math.chair@cjcollegeprep.org',
        name: 'Math Department Chair',
        role: Role.DEPARTMENT_HEAD,
        department: Department.MATH,
      },
      {
        email: 'science.chair@cjcollegeprep.org',
        name: 'Science Department Chair',
        role: Role.DEPARTMENT_HEAD,
        department: Department.SCIENCE,
      },
      {
        email: 'math.teacher@cjcollegeprep.org',
        name: 'Math Teacher',
        role: Role.TEACHER,
        department: Department.MATH,
      },
      {
        email: 'science.teacher@cjcollegeprep.org',
        name: 'Science Teacher',
        role: Role.TEACHER,
        department: Department.SCIENCE,
      },
    ];

    for (const userData of users) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          role: userData.role,
          department: userData.department,
        },
        create: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          department: userData.department,
        },
      });
    }

    console.log('Test data initialized successfully');
    return { district, school, campus };
  } catch (error) {
    console.error('Error initializing test data:', error);
    throw error;
  }
} 
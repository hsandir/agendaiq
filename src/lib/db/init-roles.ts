import { prisma } from './prisma';

const DEFAULT_ROLES = [
  {
    title: 'Administrator',
    priority: 1,
    category: 'ADMIN',
    is_leadership: true,
  },
  {
    title: 'Superintendent',
    priority: 2,
    category: 'DISTRICT',
    is_leadership: true,
  },
  {
    title: 'Principal',
    priority: 3,
    category: 'SCHOOL',
    is_leadership: true,
  },
  {
    title: 'Vice Principal',
    priority: 4,
    category: 'SCHOOL',
    is_leadership: true,
  },
  {
    title: 'Department Head',
    priority: 5,
    category: 'DEPARTMENT',
    is_leadership: true,
  },
  {
    title: 'Teacher',
    priority: 6,
    category: 'STAFF',
    is_leadership: false,
  },
  {
    title: 'Staff',
    priority: 7,
    category: 'STAFF',
    is_leadership: false,
  },
];

export async function initializeRoles() {
  try {
    // Create roles
    for (const roleData of DEFAULT_ROLES) {
      await prisma.role.upsert({
        where: { title: roleData.title },
        update: {}, // No updates needed if exists
        create: roleData,
      });
    }

    console.log('Default roles initialized successfully');
  } catch (error: unknown) {
    console.error('Error initializing roles:', error);
    throw error;
  }
} 
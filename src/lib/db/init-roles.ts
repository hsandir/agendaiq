import { prisma } from './prisma';

const DEFAULT_ROLES = [
  {
    name: 'ADMIN',
    subordinates: ['STEM_CHAIR', 'DEPARTMENT_CHAIR', 'TEACHER'],
  },
  {
    name: 'STEM_CHAIR',
    subordinates: ['DEPARTMENT_CHAIR', 'TEACHER'],
  },
  {
    name: 'DEPARTMENT_CHAIR',
    subordinates: ['TEACHER'],
  },
  {
    name: 'TEACHER',
    subordinates: [],
  },
];

export async function initializeRoles() {
  try {
    // Create roles first
    for (const role of DEFAULT_ROLES) {
      await prisma.roleHierarchy.upsert({
        where: { name: role.name },
        update: {}, // No updates needed if exists
        create: {
          name: role.name,
        },
      });
    }

    // Set up relationships after all roles exist
    for (const role of DEFAULT_ROLES) {
      await prisma.roleHierarchy.update({
        where: { name: role.name },
        data: {
          subordinateRoles: {
            connect: role.subordinates.map(name => ({ name })),
          },
        },
      });
    }

    console.log('Default roles initialized successfully');
  } catch (error) {
    console.error('Error initializing roles:', error);
    throw error;
  }
} 
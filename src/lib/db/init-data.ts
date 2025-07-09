import { prisma } from './prisma';

export async function initializeDefaultData() {
  try {
    // Create default school
    const school = await prisma.school.upsert({
      where: { id: 'default-school' },
      update: {},
      create: {
        id: 'default-school',
        name: 'AgendaIQ Academy',
        address: '123 Education Street',
        city: 'Knowledge City',
        state: 'CA',
        zipCode: '94000',
        phone: '(555) 123-4567',
        website: 'www.agendaiq-academy.edu',
        departments: ['STEM', 'MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'ARTS', 'PHYSICAL_EDUCATION'],
      },
    });

    console.log('Default school initialized successfully');
    return school;
  } catch (error) {
    console.error('Error initializing default data:', error);
    throw error;
  }
} 
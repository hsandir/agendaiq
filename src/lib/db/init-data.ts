import { prisma } from './prisma';

export async function initializeDefaultData() {
  try {
    // First, check if we have any districts
    let district = await prisma.district.findFirst();
    
    if (!district) {
      // Create default district if none exists
      district = await prisma.district.create({
        data: {
          name: 'Default District',
          code: 'DD001'
        }
      });
    }
    
    // Create default school
    const school = await prisma.school.findFirst({
      where: {
        name: 'AgendaIQ Academy'
      }
    });
    
    if (!school) {
      const newSchool = await prisma.school.create({
        data: {
          name: 'AgendaIQ Academy',
          address: '123 Education Street',
          code: 'AIA001',
          district_id: district.id
        },
      });
      console.log('Default school initialized successfully');
      return newSchool;
    }

    console.log('Default school already exists');
    return school;
  } catch (error) {
    console.error('Error initializing default data:', error);
    throw error;
  }
} 
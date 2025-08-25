const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminStaff() {
  try {
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (\!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    // Find Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (\!adminRole) {
      console.log('Administrator role not found');
      return;
    }
    
    // Find District Office department
    const districtOffice = await prisma.department.findFirst({
      where: { name: 'District Office' }
    });
    
    if (\!districtOffice) {
      console.log('District Office department not found');
      return;
    }
    
    // Find CJCP Somerset school
    const school = await prisma.school.findFirst({
      where: { name: 'CJCP Somerset' }
    });
    
    if (\!school) {
      console.log('CJCP Somerset school not found');
      return;
    }
    
    // Find district
    const district = await prisma.district.findFirst({
      where: { name: 'CJCP Somerset' }
    });
    
    if (\!district) {
      console.log('CJCP Somerset district not found');
      return;
    }
    
    // Check if staff record already exists
    const existingStaff = await prisma.staff.findFirst({
      where: { user_id: adminUser.id }
    });
    
    if (existingStaff) {
      console.log('Staff record already exists for admin user');
      return;
    }
    
    // Create staff record
    const staff = await prisma.staff.create({
      data: {
        first_name: 'Admin',
        last_name: 'User',
        email: adminUser.email,
        user_id: adminUser.id,
        role_id: adminRole.id,
        department_id: districtOffice.id,
        school_id: school.id,
        district_id: district.id,
        enrollment_date: new Date(),
        is_active: true
      }
    });
    
    console.log('Staff record created successfully:', staff);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminStaff();

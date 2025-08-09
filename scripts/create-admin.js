const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('1234', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@school.edu',
        name: 'Admin User',
        hashedPassword: hashedPassword,
        is_admin: true
      }
    });
    
    console.log('Admin user created:', adminUser.email);
    
    // Find Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    // Find District Office department
    const districtOffice = await prisma.department.findFirst({
      where: { name: 'District Office' }
    });
    
    // Find school
    const school = await prisma.school.findFirst({
      where: { name: 'CJCP Somerset Campus' }
    });
    
    // Find district
    const district = await prisma.district.findFirst({
      where: { name: 'CJCP Somerset' }
    });
    
    if (adminRole && districtOffice && school && district) {
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
      
      console.log('Staff record created for admin');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

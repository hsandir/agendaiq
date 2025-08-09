const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminRequirements() {
  try {
    // Create Administrator role if it doesn't exist
    let adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          title: 'Administrator',
          priority: 1,
          is_leadership: true,
          category: 'executive',
          level: 1
        }
      });
      console.log('Administrator role created');
    }
    
    // Create District Office department if it doesn't exist
    let districtOffice = await prisma.department.findFirst({
      where: { name: 'District Office' }
    });
    
    if (!districtOffice) {
      districtOffice = await prisma.department.create({
        data: {
          name: 'District Office',
          code: 'DO',
          school_id: 1 // CJCP Somerset Campus
        }
      });
      console.log('District Office department created');
    }
    
    // Now create staff record for admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (adminUser) {
      const existingStaff = await prisma.staff.findFirst({
        where: { user_id: adminUser.id }
      });
      
      if (!existingStaff) {
        const staff = await prisma.staff.create({
          data: {
            first_name: 'Admin',
            last_name: 'User',
            email: adminUser.email,
            user_id: adminUser.id,
            role_id: adminRole.id,
            department_id: districtOffice.id,
            school_id: 1,
            district_id: 1,
            enrollment_date: new Date(),
            is_active: true
          }
        });
        console.log('Staff record created for admin user');
      } else {
        console.log('Staff record already exists for admin user');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminRequirements();

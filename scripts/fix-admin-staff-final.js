const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminStaff() {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    const districtOffice = await prisma.department.findFirst({
      where: { name: 'District Office' }
    });
    
    const school = await prisma.school.findFirst({
      where: { name: 'CJCP Somerset Campus' }
    });
    
    const district = await prisma.district.findFirst({
      where: { name: 'CJCP Somerset' }
    });
    
    if (adminUser && adminRole && districtOffice && school && district) {
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
            school_id: school.id,
            district_id: district.id,
            enrollment_date: new Date(),
            is_active: true
          }
        });
        console.log('Staff record created successfully:', staff.id);
      } else {
        console.log('Staff record already exists');
      }
    } else {
      console.log('Missing required data:');
      console.log('Admin user:', !!adminUser);
      console.log('Admin role:', !!adminRole);
      console.log('District Office:', !!districtOffice);
      console.log('School:', !!school);
      console.log('District:', !!district);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminStaff();

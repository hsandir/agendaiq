const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminStaff() {
  try {
    // 1. Find Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (!adminRole) {
      console.error('Administrator role not found!');
      return;
    }
    
    console.log('Found Administrator role:', adminRole.id);
    
    // 2. Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: { Staff: true }
    });
    
    if (!adminUser) {
      console.error('admin@school.edu not found!');
      return;
    }
    
    // 3. Find District Office department
    let districtOffice = await prisma.department.findFirst({
      where: { name: 'District Office' }
    });
    
    if (!districtOffice) {
      console.log('Creating District Office department...');
      districtOffice = await prisma.department.create({
        data: {
          name: 'District Office',
          code: 'DO',
          school_id: 2 // CJCP Somerset Campus
        }
      });
    }
    
    // 4. Delete existing staff record if exists (without role)
    if (adminUser.Staff) {
      console.log('Deleting existing staff record without role...');
      await prisma.staff.delete({
        where: { id: adminUser.Staff.id }
      });
    }
    
    // 5. Create new staff record with Administrator role
    const staff = await prisma.staff.create({
      data: {
        user_id: adminUser.id,
        department_id: districtOffice.id,
        role_id: adminRole.id,
        school_id: 2, // CJCP Somerset Campus
        district_id: 2, // CJCP Somerset District
        extension: '1000',
        room: '500',
        hire_date: new Date('2020-01-01'),
        is_active: true,
        flags: ['active', 'admin', 'leadership']
      },
      include: {
        User: true,
        Role: true,
        Department: true
      }
    });
    
    console.log('\n✅ Successfully created staff record for admin@school.edu:');
    console.log('- User:', staff.User.email);
    console.log('- Role:', staff.Role?.title);
    console.log('- Role Priority:', staff.Role?.priority);
    console.log('- Role Level:', staff.Role?.level);
    console.log('- Department:', staff.Department?.name);
    console.log('- Extension:', staff.extension);
    console.log('- Room:', staff.room);
    console.log('- Flags:', staff.flags);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminStaff();
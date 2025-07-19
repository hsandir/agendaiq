const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminStaff() {
  try {
    console.log('Fixing admin staff record...');

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: { Staff: true }
    });

    if (!user) {
      console.log('Admin user not found!');
      return;
    }

    if (user.Staff.length > 0) {
      console.log('Admin already has staff record!');
      return;
    }

    // Find or create Administrator role
    let role = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          title: 'Administrator',
          priority: 1,
          is_leadership: true,
          category: 'Management'
        }
      });
      console.log('Created Administrator role');
    }

    // Find or create Administration department
    let department = await prisma.department.findFirst({
      where: { name: 'Administration' }
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          name: 'Administration',
          code: 'ADMIN'
        }
      });
      console.log('Created Administration department');
    }

    // Find or create default school
    let school = await prisma.school.findFirst();
    
    if (!school) {
      // Find or create default district first
      let district = await prisma.district.findFirst();
      
      if (!district) {
        district = await prisma.district.create({
          data: {
            name: 'Default District',
            code: 'DIST001'
          }
        });
        console.log('Created default district');
      }

      school = await prisma.school.create({
        data: {
          name: 'Default School',
          code: 'SCH001',
          district_id: district.id
        }
      });
      console.log('Created default school');
    }

    // Create staff record for admin
    const staff = await prisma.staff.create({
      data: {
        staff_id: `ADMIN-${Date.now()}`,
        user_id: user.id,
        role_id: role.id,
        department_id: department.id,
        school_id: school.id
      }
    });

    console.log('✅ Admin staff record created successfully!');
    console.log('Staff ID:', staff.staff_id);
    console.log('Role:', role.title);
    console.log('Department:', department.name);

  } catch (error) {
    console.error('Error fixing admin staff:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminStaff(); 
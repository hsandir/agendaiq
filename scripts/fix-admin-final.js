const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    // First check what school exists
    const school = await prisma.school.findFirst();
    if (\!school) {
      console.log('No school found\!');
      return;
    }
    console.log('Using school:', school.name);
    
    // Check what district exists
    const district = await prisma.district.findFirst();
    if (\!district) {
      console.log('No district found\!');
      return;
    }
    console.log('Using district:', district.name);
    
    // Check or create Administrator role
    let adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (\!adminRole) {
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
    } else {
      console.log('Administrator role exists');
    }
    
    // Use existing department or create District Office
    let department = await prisma.department.findFirst({
      where: { name: 'Executive Leadership' }
    });
    
    if (\!department) {
      department = await prisma.department.findFirst();
      console.log('Using first available department:', department.name);
    } else {
      console.log('Using Executive Leadership department');
    }
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (\!adminUser) {
      console.log('Admin user not found\!');
      return;
    }
    
    // Check if staff record exists
    const existingStaff = await prisma.staff.findFirst({
      where: { user_id: adminUser.id }
    });
    
    if (existingStaff) {
      // Update existing staff record with Administrator role
      await prisma.staff.update({
        where: { id: existingStaff.id },
        data: {
          role_id: adminRole.id,
          is_active: true
        }
      });
      console.log('Updated existing staff record with Administrator role');
    } else {
      // Create new staff record
      await prisma.staff.create({
        data: {
          first_name: 'Admin',
          last_name: 'User',
          email: adminUser.email,
          user_id: adminUser.id,
          role_id: adminRole.id,
          department_id: department.id,
          school_id: school.id,
          district_id: district.id,
          enrollment_date: new Date(),
          is_active: true
        }
      });
      console.log('Created new staff record with Administrator role');
    }
    
    // Verify the fix
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true
          }
        }
      }
    });
    
    if (verifyUser && verifyUser.Staff[0]) {
      console.log('\nVerification successful\!');
      console.log('User:', verifyUser.email);
      console.log('Role:', verifyUser.Staff[0].Role.title);
      console.log('Department:', verifyUser.Staff[0].Department.name);
      console.log('Is Leadership:', verifyUser.Staff[0].Role.is_leadership);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();

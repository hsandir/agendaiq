const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminComplete() {
  try {
    console.log('=== FIXING ADMIN USER ===\n');
    
    // 1. Find or create Administrator role
    let adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (!adminRole) {
      console.log('Administrator role not found, creating...');
      adminRole = await prisma.role.create({
        data: {
          title: 'Administrator',
          description: 'System administrator with full access',
          priority: 0,
          level: 0,
          is_leadership: true,
          category: 'Administrative'
        }
      });
    }
    console.log('✓ Administrator role:', adminRole.id);
    
    // 2. Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (!adminUser) {
      console.error('admin@school.edu not found!');
      return;
    }
    console.log('✓ Admin user found:', adminUser.id);
    
    // 3. Find or create District Office department
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
    console.log('✓ District Office department:', districtOffice.id);
    
    // 4. Check for existing staff record
    const existingStaff = await prisma.staff.findFirst({
      where: { user_id: adminUser.id }
    });
    
    let staff;
    
    if (existingStaff) {
      console.log('Updating existing staff record...');
      // Update existing staff record
      staff = await prisma.staff.update({
        where: { id: existingStaff.id },
        data: {
          department_id: districtOffice.id,
          role_id: adminRole.id,
          school_id: 2,
          district_id: 2,
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
    } else {
      console.log('Creating new staff record...');
      // Create new staff record
      staff = await prisma.staff.create({
        data: {
          user_id: adminUser.id,
          department_id: districtOffice.id,
          role_id: adminRole.id,
          school_id: 2,
          district_id: 2,
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
    }
    
    console.log('\n✅ Successfully fixed admin@school.edu:');
    console.log('- User:', staff.User.email);
    console.log('- Role:', staff.Role?.title);
    console.log('- Role Priority:', staff.Role?.priority);
    console.log('- Role Level:', staff.Role?.level);
    console.log('- Department:', staff.Department?.name);
    console.log('- Extension:', staff.extension);
    console.log('- Room:', staff.room);
    console.log('- Flags:', staff.flags);
    console.log('- is_admin flag:', adminUser.is_admin);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminComplete();
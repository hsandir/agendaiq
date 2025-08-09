const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compareAdminData() {
  try {
    // Get admin user with all relations
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true,
            District: true,
            Staff: true // Manager relation
          }
        }
      }
    });
    
    // Get CEO user with all relations
    const ceoUser = await prisma.user.findUnique({
      where: { email: 'nsercan@cjcollegeprep.org' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true,
            District: true,
            Staff: true // Manager relation
          }
        }
      }
    });
    
    console.log('ADMIN USER (admin@school.edu):');
    console.log('================================');
    console.log('User ID:', adminUser.id);
    console.log('Email:', adminUser.email);
    console.log('Name:', adminUser.name);
    console.log('Is Admin:', adminUser.is_admin);
    console.log('Email Verified:', adminUser.emailVerified);
    console.log('Two Factor Enabled:', adminUser.two_factor_enabled);
    console.log('Theme Preference:', adminUser.theme_preference);
    console.log('Layout Preference:', adminUser.layout_preference);
    
    if (adminUser.Staff[0]) {
      const staff = adminUser.Staff[0];
      console.log('\nSTAFF RECORD:');
      console.log('- Staff ID:', staff.id);
      console.log('- User ID:', staff.user_id);
      console.log('- Role ID:', staff.role_id);
      console.log('- Role Title:', staff.Role?.title);
      console.log('- Department ID:', staff.department_id);
      console.log('- Department Name:', staff.Department?.name);
      console.log('- School ID:', staff.school_id);
      console.log('- School Name:', staff.School?.name);
      console.log('- District ID:', staff.district_id);
      console.log('- District Name:', staff.District?.name);
      console.log('- Manager ID:', staff.manager_id);
      console.log('- Extension:', staff.extension);
      console.log('- Room:', staff.room);
      console.log('- Hire Date:', staff.hire_date);
      console.log('- Is Active:', staff.is_active);
      console.log('- Flags:', staff.flags);
      console.log('- Endorsements:', staff.endorsements);
    } else {
      console.log('\nNO STAFF RECORD!');
    }
    
    console.log('\n\nCEO USER (nsercan@cjcollegeprep.org):');
    console.log('=====================================');
    console.log('User ID:', ceoUser.id);
    console.log('Email:', ceoUser.email);
    console.log('Name:', ceoUser.name);
    console.log('Is Admin:', ceoUser.is_admin);
    console.log('Email Verified:', ceoUser.emailVerified);
    console.log('Two Factor Enabled:', ceoUser.two_factor_enabled);
    console.log('Theme Preference:', ceoUser.theme_preference);
    console.log('Layout Preference:', ceoUser.layout_preference);
    
    if (ceoUser.Staff[0]) {
      const staff = ceoUser.Staff[0];
      console.log('\nSTAFF RECORD:');
      console.log('- Staff ID:', staff.id);
      console.log('- User ID:', staff.user_id);
      console.log('- Role ID:', staff.role_id);
      console.log('- Role Title:', staff.Role?.title);
      console.log('- Department ID:', staff.department_id);
      console.log('- Department Name:', staff.Department?.name);
      console.log('- School ID:', staff.school_id);
      console.log('- School Name:', staff.School?.name);
      console.log('- District ID:', staff.district_id);
      console.log('- District Name:', staff.District?.name);
      console.log('- Manager ID:', staff.manager_id);
      console.log('- Extension:', staff.extension);
      console.log('- Room:', staff.room);
      console.log('- Hire Date:', staff.hire_date);
      console.log('- Is Active:', staff.is_active);
      console.log('- Flags:', staff.flags);
      console.log('- Endorsements:', staff.endorsements);
    }
    
    console.log('\n\nDIFFERENCES:');
    console.log('============');
    
    // Compare fields
    if (adminUser.Staff[0] && ceoUser.Staff[0]) {
      const adminStaff = adminUser.Staff[0];
      const ceoStaff = ceoUser.Staff[0];
      
      const differences = [];
      
      if (!adminStaff.extension && ceoStaff.extension) {
        differences.push('Admin missing extension (CEO has: ' + ceoStaff.extension + ')');
      }
      if (!adminStaff.room && ceoStaff.room) {
        differences.push('Admin missing room (CEO has: ' + ceoStaff.room + ')');
      }
      if (adminStaff.flags.length === 0 && ceoStaff.flags.length > 0) {
        differences.push('Admin missing flags (CEO has: ' + ceoStaff.flags.join(', ') + ')');
      }
      if (!adminStaff.hire_date && ceoStaff.hire_date) {
        differences.push('Admin missing hire_date');
      }
      
      if (differences.length > 0) {
        differences.forEach(diff => console.log('- ' + diff));
      } else {
        console.log('No significant differences found');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareAdminData();
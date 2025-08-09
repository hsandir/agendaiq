const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminStaffData() {
  try {
    // Find admin staff record
    const adminStaff = await prisma.staff.findFirst({
      where: {
        User: {
          email: 'admin@school.edu'
        }
      }
    });
    
    if (!adminStaff) {
      console.log('Admin staff record not found!');
      return;
    }
    
    console.log('Current admin staff data:');
    console.log('- ID:', adminStaff.id);
    console.log('- Extension:', adminStaff.extension);
    console.log('- Room:', adminStaff.room);
    console.log('- Flags:', adminStaff.flags);
    console.log('- Is Active:', adminStaff.is_active);
    
    // Update admin staff with missing fields
    const updatedStaff = await prisma.staff.update({
      where: { id: adminStaff.id },
      data: {
        extension: '1000',  // Give admin extension 1000 (highest priority)
        room: '500',        // Executive floor room
        flags: ['active'],  // Add active flag
        is_active: true     // Ensure active
      }
    });
    
    console.log('\nUpdated admin staff data:');
    console.log('- Extension:', updatedStaff.extension);
    console.log('- Room:', updatedStaff.room);
    console.log('- Flags:', updatedStaff.flags);
    console.log('- Is Active:', updatedStaff.is_active);
    
    // Verify the complete user data
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true,
            District: true
          }
        }
      }
    });
    
    console.log('\nComplete admin user verification:');
    console.log('- Email:', verifyUser.email);
    console.log('- Name:', verifyUser.name);
    console.log('- Is Admin:', verifyUser.is_admin);
    console.log('- Staff Role:', verifyUser.Staff[0]?.Role.title);
    console.log('- Staff Department:', verifyUser.Staff[0]?.Department.name);
    console.log('- Staff Extension:', verifyUser.Staff[0]?.extension);
    console.log('- Staff Room:', verifyUser.Staff[0]?.room);
    console.log('- Staff Flags:', verifyUser.Staff[0]?.flags);
    console.log('- Staff Active:', verifyUser.Staff[0]?.is_active);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminStaffData();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminPermissions() {
  try {
    console.log('🔧 Fixing admin permissions...');
    
    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@cjcp.edu' },
      include: { Staff: true }
    });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('📊 Current admin status:');
    console.log('- Email:', admin.email);
    console.log('- Is admin:', admin.is_admin);
    console.log('- Has staff record:', !!admin.Staff[0]);
    
    // Update user to be admin
    await prisma.user.update({
      where: { email: 'admin@cjcp.edu' },
      data: { 
        is_admin: true,
        emailVerified: new Date()
      }
    });
    
    // Get Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    if (!adminRole) {
      console.log('❌ Administrator role not found');
      return;
    }
    
    // Update or create staff record with Administrator role
    if (admin.Staff[0]) {
      await prisma.staff.update({
        where: { id: admin.Staff[0].id },
        data: {
          role_id: adminRole.id
        }
      });
      console.log('✅ Updated existing staff record with Administrator role');
    } else {
      // Get required references
      const execDept = await prisma.department.findFirst({ where: { code: 'EXEC' } });
      const school = await prisma.school.findFirst();
      const district = await prisma.district.findFirst();
      
      if (execDept && school && district) {
        await prisma.staff.create({
          data: {
            user_id: admin.id,
            role_id: adminRole.id,
            department_id: execDept.id,
            school_id: school.id,
            district_id: district.id
          }
        });
        console.log('✅ Created staff record with Administrator role');
      }
    }
    
    // Verify the changes
    const updatedAdmin = await prisma.user.findUnique({
      where: { email: 'admin@cjcp.edu' },
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
    
    console.log('\n🎯 Final admin status:');
    console.log('- Is admin:', updatedAdmin.is_admin);
    console.log('- Role:', updatedAdmin.Staff[0]?.Role?.title);
    console.log('- Role priority:', updatedAdmin.Staff[0]?.Role?.priority);
    console.log('- Is leadership:', updatedAdmin.Staff[0]?.Role?.is_leadership);
    console.log('- Department:', updatedAdmin.Staff[0]?.Department?.name);
    
    console.log('\n✅ Admin permissions fixed!');
    console.log('📧 Login with: admin@cjcp.edu / admin123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions(); 
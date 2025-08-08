const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createSimpleAdmin() {
  try {
    console.log('🔧 Creating simple admin user...');
    
    // Delete existing staff and admin if exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@cjcp.edu' },
      include: { Staff: true }
    });
    
    if (existingAdmin) {
      // Delete staff first
      await prisma.staff.deleteMany({
        where: { user_id: existingAdmin.id }
      });
      
      // Then delete user
      await prisma.user.delete({
        where: { id: existingAdmin.id }
      });
      
      console.log('🗑️ Deleted existing admin and staff');
    }
    
    // Create new admin with simple setup
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cjcp.edu',
        name: 'Admin User',
        hashedPassword,
        emailVerified: new Date(),
        is_admin: true
      }
    });
    
    console.log('✅ Created admin user:', admin.email);
    
    // Test password immediately
    const testPassword = await bcrypt.compare('admin123', hashedPassword);
    console.log('🔐 Password test:', testPassword);
    
    // Get CEO role for staff creation
    const ceoRole = await prisma.role.findFirst({
      where: { title: 'Chief Education Officer (CEO)' }
    });
    
    const execDept = await prisma.department.findFirst({
      where: { code: 'EXEC' }
    });
    
    const school = await prisma.school.findFirst();
    const district = await prisma.district.findFirst();
    
    if (ceoRole && execDept && school && district) {
      // Create staff record
      const staff = await prisma.staff.create({
        data: {
          user_id: admin.id,
          role_id: ceoRole.id,
          department_id: execDept.id,
          school_id: school.id,
          district_id: district.id
        }
      });
      
      console.log('✅ Created staff record');
    }
    
    console.log('\n🎉 Admin setup complete!');
    console.log('📧 Email: admin@cjcp.edu');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('You can now login at: http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleAdmin(); 
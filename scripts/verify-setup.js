const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySetup() {
  try {
    // Check admin user
    const admin = await prisma.user.findUnique({
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
    
    console.log('🔍 Admin User Verification:');
    console.log('- Email:', admin.email);
    console.log('- Name:', admin.name);
    console.log('- Has Password:', !!admin.hashedPassword);
    console.log('- Is Admin:', admin.is_admin);
    console.log('- Role:', admin.Staff[0]?.Role?.title);
    console.log('- Department:', admin.Staff[0]?.Department?.name);
    console.log('- School:', admin.Staff[0]?.School?.name);
    console.log('- District:', admin.Staff[0]?.District?.name);
    
    // Check hierarchy stats
    const stats = await Promise.all([
      prisma.district.count(),
      prisma.school.count(),
      prisma.department.count(),
      prisma.role.count(),
      prisma.user.count(),
      prisma.staff.count()
    ]);
    
    console.log('\n📊 Database Statistics:');
    console.log('- Districts:', stats[0]);
    console.log('- Schools:', stats[1]);
    console.log('- Departments:', stats[2]);
    console.log('- Roles:', stats[3]);
    console.log('- Users:', stats[4]);
    console.log('- Staff Records:', stats[5]);
    
    // Check leadership roles
    const leadership = await prisma.role.findMany({
      where: { is_leadership: true },
      include: { Department: true, Staff: { include: { User: true } } }
    });
    
    console.log('\n👑 Leadership Roles:');
    leadership.forEach(role => {
      const staffCount = role.Staff.length;
      const staffNames = role.Staff.map(s => s.User.name).join(', ');
      console.log(`- ${role.title} (${role.Department.name}): ${staffCount} staff - ${staffNames || 'None'}`);
    });
    
    // Check some key personnel
    console.log('\n👥 Key Personnel Sample:');
    const keyStaff = await prisma.staff.findMany({
      take: 10,
      include: {
        User: true,
        Role: true,
        Department: true
      },
      orderBy: { Role: { priority: 'asc' } }
    });
    
    keyStaff.forEach(staff => {
      console.log(`- ${staff.User.name}: ${staff.Role.title} (${staff.Department.name})`);
    });
    
    console.log('\n✅ Database setup verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySetup(); 
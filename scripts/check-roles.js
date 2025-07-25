const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    console.log('🔍 Checking available roles...');
    
    const roles = await prisma.role.findMany({
      orderBy: { priority: 'asc' }
    });
    
    console.log(`📊 Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`- ${role.title} (priority: ${role.priority}, leadership: ${role.is_leadership})`);
    });
    
    // Check if we need to create Administrator role
    const adminRole = roles.find(r => r.title === 'Administrator');
    if (!adminRole) {
      console.log('\n❌ Administrator role not found!');
      console.log('🔧 Creating Administrator role...');
      
      const newAdminRole = await prisma.role.create({
        data: {
          title: 'Administrator',
          priority: 1,
          category: 'Executive',
          is_leadership: true
        }
      });
      
      console.log('✅ Created Administrator role:', newAdminRole.title);
    } else {
      console.log('\n✅ Administrator role exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles(); 
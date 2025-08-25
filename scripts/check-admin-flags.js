const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminFlags() {
  try {
    // Check admin@school.edu
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    console.log('admin@school.edu:');
    console.log('- is_admin:', adminUser.is_admin);
    console.log('- Role:', adminUser.Staff[0]?.Role.title);
    console.log('- Is Leadership:', adminUser.Staff[0]?.Role.is_leadership);
    
    // Check CEO
    const ceoUser = await prisma.user.findUnique({
      where: { email: 'nsercan@cjcollegeprep.org' },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    console.log('\nnsercan@cjcollegeprep.org (CEO):');
    console.log('- is_admin:', ceoUser.is_admin);
    console.log('- Role:', ceoUser.Staff[0]?.Role.title);
    console.log('- Is Leadership:', ceoUser.Staff[0]?.Role.is_leadership);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminFlags();

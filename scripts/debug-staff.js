const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUserStaff() {
  try {
    // Michael Thompson'ı kontrol et (CSV'de var)
    const user = await prisma.user.findUnique({
      where: { email: 'michael.thompson@agendaiq.edu' },
      include: { Staff: { include: { Role: true, Department: true } } }
    });
    
    console.log('🔍 Michael Thompson debug:');
    console.log('User found:', !!user);
    if (user) {
      console.log('Staff count:', user.Staff.length);
      console.log('Staff data:', user.Staff[0] ? {
        id: user.Staff[0].id,
        role: user.Staff[0].Role?.title,
        department: user.Staff[0].Department?.name
      } : 'No staff record');
    }
    
    // Megan Evans'ı da kontrol et
    const user2 = await prisma.user.findUnique({
      where: { email: 'megan.evans@agendaiq.edu' },
      include: { Staff: { include: { Role: true, Department: true } } }
    });
    
    console.log('\n🔍 Megan Evans debug:');
    console.log('User found:', !!user2);
    if (user2) {
      console.log('Staff count:', user2.Staff.length);
      console.log('Staff data:', user2.Staff[0] ? {
        id: user2.Staff[0].id,
        role: user2.Staff[0].Role?.title,
        department: user2.Staff[0].Department?.name
      } : 'No staff record');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserStaff(); 
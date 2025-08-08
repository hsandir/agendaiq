const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function checkAdminLogin() {
  try {
    console.log('🔍 Checking admin login credentials...');
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@cjcp.edu' }
    });
    
    console.log('📊 Admin user details:');
    console.log('- Found:', !!admin);
    console.log('- Email:', admin?.email);
    console.log('- Name:', admin?.name);
    console.log('- Has hashedPassword:', !!admin?.hashedPassword);
    console.log('- Email verified:', !!admin?.emailVerified);
    console.log('- Is admin:', admin?.is_admin);
    
    if (admin?.hashedPassword) {
      console.log('\n🔐 Password verification test:');
      
      // Test the password we think is correct
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, admin.hashedPassword);
      console.log(`- Testing "${testPassword}":`, isValid);
      
      // Show hash info for debugging
      console.log('- Hash starts with:', admin.hashedPassword.substring(0, 20));
      console.log('- Hash length:', admin.hashedPassword.length);
      
      // If password test fails, try regenerating the hash
      if (!isValid) {
        console.log('\n🔧 Regenerating password hash...');
        const newHash = await bcrypt.hash('admin123', 12);
        
        await prisma.user.update({
          where: { email: 'admin@cjcp.edu' },
          data: { hashedPassword: newHash }
        });
        
        console.log('✅ Password hash updated');
        
        // Test again
        const retestValid = await bcrypt.compare('admin123', newHash);
        console.log('- New password test:', retestValid);
      }
    } else {
      console.log('\n❌ No password hash found! Creating one...');
      const newHash = await bcrypt.hash('admin123', 12);
      
      await prisma.user.update({
        where: { email: 'admin@cjcp.edu' },
        data: { hashedPassword: newHash }
      });
      
      console.log('✅ Password hash created');
    }
    
    // Final verification
    console.log('\n🎯 Final verification:');
    const updatedAdmin = await prisma.user.findUnique({
      where: { email: 'admin@cjcp.edu' }
    });
    
    const finalTest = await bcrypt.compare('admin123', updatedAdmin.hashedPassword);
    console.log('- Final password test:', finalTest);
    console.log('- Email for login:', updatedAdmin.email);
    console.log('- Password for login: admin123');
    
    if (finalTest) {
      console.log('\n✅ Admin login should work now!');
    } else {
      console.log('\n❌ Still having issues with password');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminLogin(); 
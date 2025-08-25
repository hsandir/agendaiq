const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Testing Authentication System\n');

  // Test 4: Check database connection
  console.log('\n4️⃣ Testing Database Connection');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { is_admin: true } });
    
    console.log(`   Total users: ${userCount}`);
    console.log(`   Admin users: ${adminCount}`);
    console.log(`   Database: ✅ Connected\n`);
    
    // Check admin users
    const admins = await prisma.user.findMany({
      where: { is_admin: true },
      select: {
        email: true,
        is_system_admin: true,
        is_school_admin: true,
        hashedPassword: true
      }
    });
    
    console.log('   Admin Users:');
    for (const admin of admins) {
      console.log(`     - ${admin.email} (System: ${admin.is_system_admin}, School: ${admin.is_school_admin})`);
      console.log(`       Password Hash: ${admin.hashedPassword ? '✅ Set' : '❌ Missing'}`);
    }
  } catch (error) {
    console.log(`   ❌ Database Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // Test 5: Test password validation
  console.log('\n5️⃣ Testing Password Validation');
  const bcrypt = require('bcryptjs');
  const prisma2 = new PrismaClient();
  
  try {
    const admin = await prisma2.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (admin && admin.hashedPassword) {
      const isValid = await bcrypt.compare('1234', admin.hashedPassword);
      console.log(`   Password '1234' for admin@school.edu: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      
      // Test wrong password
      const isInvalid = await bcrypt.compare('wrong', admin.hashedPassword);
      console.log(`   Password 'wrong' for admin@school.edu: ${isInvalid ? '❌ Should be invalid!' : '✅ Correctly rejected'}`);
    } else {
      console.log('   ❌ Admin user not found or no password set');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  } finally {
    await prisma2.$disconnect();
  }

  console.log('\n✨ Authentication testing complete!');
}

testAuth().catch(console.error);

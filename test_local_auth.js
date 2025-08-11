const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function testAuth() {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('Testing local authentication...\n');
    
    // Test connection
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected successfully. Found ${userCount} users.\n`);
    
    // Test admin user
    const testEmail = 'admin@school.edu';
    const testPassword = '1234';
    
    console.log(`Testing login for: ${testEmail}`);
    
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
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
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.hashedPassword,
      emailVerified: !!user.emailVerified,
      role: user.Staff?.[0]?.Role?.title || 'No role'
    });
    
    if (!user.hashedPassword) {
      console.log('❌ User has no password');
      return;
    }
    
    // Test password
    const isValid = await bcrypt.compare(testPassword, user.hashedPassword);
    console.log(`\n${isValid ? '✅' : '❌'} Password validation: ${isValid ? 'VALID' : 'INVALID'}`);
    
    if (isValid) {
      console.log('\n✅ Authentication should work with these credentials');
      console.log('   Email:', testEmail);
      console.log('   Password:', testPassword);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('invalid port number')) {
      console.log('\n❌ DATABASE_URL has invalid format');
      console.log('   Check special characters in password are properly encoded');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
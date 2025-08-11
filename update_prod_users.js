const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function updateUsers() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
      }
    }
  });

  const users = [
    {
      email: 'admin@school.edu',
      password: '1234',
      name: 'System Administrator'
    },
    {
      email: 'sysadmin@cjcollegeprep.org', 
      password: 'password123',
      name: 'School Administrator'
    },
    {
      email: 'nsercan@cjcollegeprep.org',
      password: 'password123',
      name: 'Dr. Namik Sercan'
    },
    {
      email: 'fbarker@cjcollegeprep.org',
      password: 'password123',
      name: 'Ms. Brown'
    }
  ];

  try {
    console.log('Updating production users...\n');
    
    for (const userData of users) {
      console.log(`Processing ${userData.email}...`);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        // Update password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            hashedPassword: hashedPassword,
            emailVerified: new Date(),
            name: userData.name
          }
        });
        
        console.log(`✅ Updated: ${userData.email} with password: ${userData.password}`);
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Get next ID
        const maxUser = await prisma.user.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true }
        });
        const nextId = (maxUser?.id || 0) + 1;
        
        await prisma.user.create({
          data: {
            id: nextId,
            email: userData.email,
            name: userData.name,
            hashedPassword: hashedPassword,
            emailVerified: new Date()
          }
        });
        
        console.log(`✅ Created: ${userData.email} with password: ${userData.password}`);
      }
    }
    
    // Also restore hs@test.com from earlier change
    console.log('\nRestoring original user (was changed to hs@test.com)...');
    
    const hsUser = await prisma.user.findUnique({
      where: { email: 'hs@test.com' }
    });
    
    if (hsUser) {
      // This was originally sysadmin@cjcollegeprep.org, restore it
      const originalExists = await prisma.user.findUnique({
        where: { email: 'sysadmin@cjcollegeprep.org' }
      });
      
      if (!originalExists) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
          where: { id: hsUser.id },
          data: {
            email: 'sysadmin@cjcollegeprep.org',
            name: 'School System Administrator',
            hashedPassword: hashedPassword
          }
        });
        console.log('✅ Restored sysadmin@cjcollegeprep.org');
      }
    }
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('1. admin@school.edu / 1234');
    console.log('2. sysadmin@cjcollegeprep.org / password123');
    console.log('3. nsercan@cjcollegeprep.org / password123');
    console.log('4. fbarker@cjcollegeprep.org / password123');
    
    // Verify all users
    console.log('\n=== VERIFICATION ===');
    for (const userData of users) {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
        select: {
          email: true,
          name: true,
          hashedPassword: true,
          emailVerified: true
        }
      });
      
      if (user) {
        console.log(`✅ ${user.email}: Has password=${!!user.hashedPassword}, Verified=${!!user.emailVerified}`);
      } else {
        console.log(`❌ ${userData.email}: Not found`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsers();
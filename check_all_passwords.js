const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function checkPasswords() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
      }
    }
  });

  const testUsers = [
    { email: 'admin@school.edu', expectedPassword: '1234' },
    { email: 'sysadmin@cjcollegeprep.org', expectedPassword: 'password123' },
    { email: 'nsercan@cjcollegeprep.org', expectedPassword: 'password123' },
    { email: 'fbarker@cjcollegeprep.org', expectedPassword: 'password123' }
  ];

  try {
    console.log('=== PRODUCTION DATABASE PASSWORD CHECK ===\n');
    
    for (const testUser of testUsers) {
      console.log(`\n📧 Checking ${testUser.email}:`);
      console.log('-'.repeat(50));
      
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        select: {
          id: true,
          email: true,
          name: true,
          hashedPassword: true,
          emailVerified: true,
          Staff: {
            select: {
              Role: {
                select: { title: true }
              }
            }
          }
        }
      });
      
      if (!user) {
        console.log('❌ User NOT FOUND in database');
        continue;
      }
      
      console.log('✅ User found:');
      console.log('   - ID:', user.id);
      console.log('   - Name:', user.name);
      console.log('   - Email Verified:', !!user.emailVerified);
      console.log('   - Role:', user.Staff?.[0]?.Role?.title || 'No role');
      
      if (!user.hashedPassword) {
        console.log('❌ NO PASSWORD SET!');
        
        // Set the password
        console.log(`   Setting password to: ${testUser.expectedPassword}`);
        const hashedPassword = await bcrypt.hash(testUser.expectedPassword, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            hashedPassword: hashedPassword,
            emailVerified: new Date()
          }
        });
        console.log('   ✅ Password has been set');
        
      } else {
        // Test the password
        const isValid = await bcrypt.compare(testUser.expectedPassword, user.hashedPassword);
        
        if (isValid) {
          console.log(`✅ Password "${testUser.expectedPassword}" is CORRECT`);
        } else {
          console.log(`❌ Password "${testUser.expectedPassword}" is WRONG`);
          
          // Fix the password
          console.log(`   Fixing password to: ${testUser.expectedPassword}`);
          const hashedPassword = await bcrypt.hash(testUser.expectedPassword, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { hashedPassword: hashedPassword }
          });
          console.log('   ✅ Password has been fixed');
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY - All users should now work with:');
    console.log('='.repeat(60));
    testUsers.forEach(u => {
      console.log(`${u.email.padEnd(35)} => ${u.expectedPassword}`);
    });
    console.log('='.repeat(60));
    
    // Also check if there are any other admin users
    console.log('\n📊 Other potential admin users in database:');
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { is_admin: true },
          { is_system_admin: true },
          { Staff: { some: { Role: { title: { contains: 'Admin' } } } } }
        ]
      },
      select: {
        email: true,
        name: true,
        hashedPassword: true,
        Staff: {
          select: {
            Role: {
              select: { title: true }
            }
          }
        }
      },
      take: 10
    });
    
    adminUsers.forEach(u => {
      if (!testUsers.find(t => t.email === u.email)) {
        console.log(`- ${u.email} (${u.name}) - Role: ${u.Staff?.[0]?.Role?.title || 'No role'} - Has Password: ${!!u.hashedPassword}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();
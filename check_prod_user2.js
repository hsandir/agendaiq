const { PrismaClient } = require('@prisma/client');

async function checkUser() {
  // Create fresh client
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
      }
    }
  });

  try {
    // First check if we can connect
    const userCount = await prisma.user.count();
    console.log('Total users in production:', userCount);

    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'hs@test.com' },
          { email: 'admin@test.com' }
        ]
      },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });

    if (adminUser) {
      console.log('\nAdmin user found:');
      console.log('- Email:', adminUser.email);
      console.log('- Name:', adminUser.name);
      console.log('- Active:', adminUser.is_active);
      console.log('- Has password:', !!adminUser.password);
      console.log('- Password hash starts with:', adminUser.password?.substring(0, 10));
      console.log('- Role:', adminUser.Staff?.Role?.title || 'No staff role');
    } else {
      console.log('\nNo admin user found with hs@test.com or admin@test.com');
      
      // List first 5 users
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          email: true,
          name: true,
          is_active: true
        }
      });
      
      console.log('\nFirst 5 users in database:');
      users.forEach(u => {
        console.log(`- ${u.email} (${u.name}) - Active: ${u.is_active}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
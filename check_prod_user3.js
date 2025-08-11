const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function checkAndCreateUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
      }
    }
  });

  try {
    console.log('Connecting to production database...');
    
    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: 'hs@test.com' }
    });

    if (existingUser) {
      console.log('\nUser hs@test.com already exists');
      console.log('- ID:', existingUser.id);
      console.log('- Name:', existingUser.name);
      
      // Update password to ensure it's "1234"
      const hashedPassword = await bcrypt.hash('1234', 10);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          hashedPassword: hashedPassword,
          emailVerified: new Date()
        }
      });
      console.log('✅ Password updated to "1234"');
    } else {
      // Create new user
      console.log('\nCreating new user hs@test.com...');
      const hashedPassword = await bcrypt.hash('1234', 10);
      
      // Find Administrator role
      const adminRole = await prisma.role.findFirst({
        where: { title: 'Administrator' }
      });
      
      if (!adminRole) {
        console.error('Administrator role not found!');
        return;
      }
      
      // Find a district and school
      const district = await prisma.district.findFirst();
      const school = await prisma.school.findFirst();
      const department = await prisma.department.findFirst();
      
      const newUser = await prisma.user.create({
        data: {
          email: 'hs@test.com',
          name: 'Test Admin',
          hashedPassword: hashedPassword,
          emailVerified: new Date(),
          is_admin: true,
          is_system_admin: true
        }
      });
      
      // Create staff entry
      if (district && school && department) {
        await prisma.staff.create({
          data: {
            user_id: newUser.id,
            first_name: 'Test',
            last_name: 'Admin',
            email: 'hs@test.com',
            phone: '555-0000',
            role_id: adminRole.id,
            district_id: district.id,
            school_id: school.id,
            department_id: department.id,
            is_active: true
          }
        });
        console.log('✅ Staff entry created');
      }
      
      console.log('✅ User created successfully');
    }
    
    // Verify the user can be found
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'hs@test.com' },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    console.log('\n✅ Verification:');
    console.log('- User exists:', !!verifyUser);
    console.log('- Has password:', !!verifyUser?.hashedPassword);
    console.log('- Email verified:', !!verifyUser?.emailVerified);
    console.log('- Staff role:', verifyUser?.Staff?.Role?.title || 'No role');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateUser();
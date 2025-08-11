const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function setupAdmin() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
      }
    }
  });

  try {
    console.log('Setting up production admin user...\n');
    
    // List available roles
    const roles = await prisma.role.findMany({
      select: { id: true, title: true }
    });
    
    console.log('Available roles:');
    roles.forEach(r => console.log(`- ${r.title} (ID: ${r.id})`));
    
    // Find the highest priority role
    const adminRole = roles.find(r => r.title === 'Administrator' || r.title === 'Müdür' || r.title === 'Yönetici') || roles[0];
    
    if (!adminRole) {
      console.error('No roles found in database!');
      return;
    }
    
    console.log(`\nUsing role: ${adminRole.title}`);
    
    // Check/create user
    let user = await prisma.user.findUnique({
      where: { email: 'hs@test.com' }
    });
    
    const hashedPassword = await bcrypt.hash('1234', 10);
    
    if (user) {
      console.log('\nUser hs@test.com exists, updating password...');
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          hashedPassword: hashedPassword,
          emailVerified: new Date(),
          is_admin: true,
          is_system_admin: true
        }
      });
      console.log('✅ Password updated');
    } else {
      console.log('\nCreating user hs@test.com...');
      user = await prisma.user.create({
        data: {
          email: 'hs@test.com',
          name: 'Hakan Test',
          hashedPassword: hashedPassword,
          emailVerified: new Date(),
          is_admin: true,
          is_system_admin: true
        }
      });
      console.log('✅ User created');
    }
    
    // Check/create staff entry
    const existingStaff = await prisma.staff.findUnique({
      where: { user_id: user.id }
    });
    
    if (!existingStaff) {
      // Get required entities
      const district = await prisma.district.findFirst();
      const school = await prisma.school.findFirst();
      const department = await prisma.department.findFirst();
      
      if (district && school && department) {
        await prisma.staff.create({
          data: {
            user_id: user.id,
            first_name: 'Hakan',
            last_name: 'Test',
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
      } else {
        console.log('⚠️  Could not create staff entry - missing district/school/department');
      }
    } else {
      console.log('✅ Staff entry already exists');
    }
    
    // Final verification
    const finalUser = await prisma.user.findUnique({
      where: { email: 'hs@test.com' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true
          }
        }
      }
    });
    
    console.log('\n=== FINAL VERIFICATION ===');
    console.log('Email:', finalUser.email);
    console.log('Name:', finalUser.name);
    console.log('Has Password:', !!finalUser.hashedPassword);
    console.log('Email Verified:', !!finalUser.emailVerified);
    console.log('Is Admin:', finalUser.is_admin);
    console.log('Is System Admin:', finalUser.is_system_admin);
    if (finalUser.Staff) {
      console.log('Staff Role:', finalUser.Staff.Role?.title);
      console.log('Department:', finalUser.Staff.Department?.name);
      console.log('School:', finalUser.Staff.School?.name);
    }
    console.log('\n✅ Setup complete! You can now login with:');
    console.log('Email: hs@test.com');
    console.log('Password: 1234');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
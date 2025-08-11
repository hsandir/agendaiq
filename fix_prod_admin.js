const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function fixAdmin() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
      }
    }
  });

  try {
    console.log('Checking production database...\n');
    
    // Check if user exists by any chance with wrong email
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'hs' } },
          { email: { contains: 'admin' } },
          { email: { contains: 'test' } },
          { name: { contains: 'Hakan' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
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
    
    console.log('Found users matching criteria:');
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.Staff?.Role?.title || 'No role'}`);
    });
    
    // Try to find by exact email
    let targetUser = await prisma.user.findUnique({
      where: { email: 'hs@test.com' }
    });
    
    if (!targetUser) {
      // Check if there's a user we can update
      const candidateUser = users.find(u => u.email.includes('hs') || u.email.includes('admin'));
      
      if (candidateUser) {
        console.log(`\nUpdating user ${candidateUser.email} to hs@test.com...`);
        
        // First check if hs@test.com is taken by another user
        const conflictUser = await prisma.user.findUnique({
          where: { email: 'hs@test.com' }
        });
        
        if (!conflictUser) {
          targetUser = await prisma.user.update({
            where: { id: candidateUser.id },
            data: { email: 'hs@test.com' }
          });
          console.log('✅ Email updated');
        } else {
          targetUser = conflictUser;
          console.log('User with hs@test.com already exists');
        }
      } else {
        // Get next available ID
        const maxUser = await prisma.user.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true }
        });
        
        const nextId = (maxUser?.id || 0) + 1;
        
        console.log(`\nCreating new user with ID ${nextId}...`);
        const hashedPassword = await bcrypt.hash('1234', 10);
        
        targetUser = await prisma.user.create({
          data: {
            id: nextId, // Explicitly set ID
            email: 'hs@test.com',
            name: 'Test Admin',
            hashedPassword: hashedPassword,
            emailVerified: new Date(),
            is_admin: true,
            is_system_admin: true
          }
        });
        console.log('✅ User created');
      }
    }
    
    // Update password for the target user
    if (targetUser) {
      console.log('\nUpdating password for hs@test.com...');
      const hashedPassword = await bcrypt.hash('1234', 10);
      
      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          hashedPassword: hashedPassword,
          emailVerified: new Date(),
          is_admin: true,
          is_system_admin: true
        }
      });
      console.log('✅ Password set to "1234"');
      
      // Check staff entry
      const staff = await prisma.staff.findUnique({
        where: { user_id: targetUser.id },
        include: { Role: true }
      });
      
      if (!staff) {
        // Create staff entry
        const adminRole = await prisma.role.findFirst({
          where: {
            OR: [
              { title: 'System Administrator' },
              { title: 'Chief Education Officer' },
              { title: 'Development Admin' }
            ]
          }
        });
        
        const district = await prisma.district.findFirst();
        const school = await prisma.school.findFirst();
        const department = await prisma.department.findFirst();
        
        if (adminRole && district && school && department) {
          await prisma.staff.create({
            data: {
              user_id: targetUser.id,
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
          console.log(`✅ Staff entry created with role: ${adminRole.title}`);
        }
      } else {
        console.log(`✅ Staff entry exists with role: ${staff.Role?.title}`);
      }
    }
    
    // Final verification
    const finalUser = await prisma.user.findUnique({
      where: { email: 'hs@test.com' },
      select: {
        id: true,
        email: true,
        name: true,
        hashedPassword: true,
        emailVerified: true,
        is_admin: true,
        is_system_admin: true,
        Staff: {
          select: {
            Role: {
              select: { title: true }
            }
          }
        }
      }
    });
    
    console.log('\n=== FINAL STATUS ===');
    if (finalUser) {
      console.log('✅ User ready for login');
      console.log('- Email: hs@test.com');
      console.log('- Password: 1234');
      console.log('- Has password hash:', !!finalUser.hashedPassword);
      console.log('- Email verified:', !!finalUser.emailVerified);
      console.log('- Is admin:', finalUser.is_admin);
      console.log('- Is system admin:', finalUser.is_system_admin);
      console.log('- Role:', finalUser.Staff?.Role?.title || 'No staff role');
    } else {
      console.log('❌ Failed to setup user');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
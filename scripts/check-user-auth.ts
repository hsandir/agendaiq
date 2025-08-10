import { prisma } from '../src/lib/prisma';

async function checkAndFixAuth() {
  try {
    console.log('Checking user authentication settings...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        Staff: {
          include: {
            Role: {
              include: {
                Permissions: true
              }
            }
          }
        }
      }
    });

    console.log('Current users in database:');
    for (const user of users) {
      console.log(`\n${user.email}:`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - System Admin: ${user.is_system_admin}`);
      console.log(`  - School Admin: ${user.is_school_admin}`);
      if (user.Staff?.[0]) {
        console.log(`  - Role: ${user.Staff[0].Role.title}`);
        console.log(`  - Role Key: ${user.Staff[0].Role.key}`);
        console.log(`  - Permissions: ${user.Staff[0].Role.Permissions.length} capabilities`);
      }
    }

    // Check capabilities for nsercan@cjcollegeprep.org
    const nsercan = users.find(u => u.email === 'nsercan@cjcollegeprep.org');
    if (nsercan) {
      console.log('\n\nChecking nsercan@cjcollegeprep.org capabilities:');
      
      // Based on policy.ts, school admin should have ops capabilities
      if (nsercan.is_school_admin) {
        console.log('✓ User is school admin - should have ops capabilities');
      } else {
        console.log('✗ User is NOT school admin - fixing...');
        await prisma.user.update({
          where: { id: nsercan.id },
          data: { is_school_admin: true, is_system_admin: false }
        });
        console.log('✓ Updated to school admin');
      }
    }

    // Ensure admin@school.edu is system admin
    const adminUser = users.find(u => u.email === 'admin@school.edu');
    if (adminUser) {
      if (!adminUser.is_system_admin) {
        console.log('\n✗ admin@school.edu is NOT system admin - fixing...');
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { is_system_admin: true, is_school_admin: false }
        });
        console.log('✓ Updated admin@school.edu to system admin');
      } else {
        console.log('\n✓ admin@school.edu is correctly set as system admin');
      }
    }

    console.log('\n\nAuthentication settings check complete.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixAuth();
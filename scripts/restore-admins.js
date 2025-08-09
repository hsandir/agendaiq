const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function restoreAdmins() {
  try {
    console.log('🔄 Restoring admin users...\n');

    // Create or update development admin
    const devAdminPassword = await bcrypt.hash('1234', 10);
    
    const devAdmin = await prisma.user.upsert({
      where: { email: 'admin@school.edu' },
      update: {
        hashedPassword: devAdminPassword,
        name: 'Development Admin',
        is_admin: true,
        is_system_admin: true,
        is_school_admin: false,
        two_factor_enabled: false,
        emailVerified: new Date(),
      },
      create: {
        email: 'admin@school.edu',
        name: 'Development Admin',
        hashedPassword: devAdminPassword,
        is_admin: true,
        is_system_admin: true,
        is_school_admin: false,
        two_factor_enabled: false,
        backup_codes: [],
        emailVerified: new Date(),
      },
    });
    
    console.log('✅ Development Admin created: admin@school.edu / 1234');

    // Create or update school admin
    const schoolAdminPassword = await bcrypt.hash('Admin123!@#', 10);
    
    const schoolAdmin = await prisma.user.upsert({
      where: { email: 'sysadmin@cjcollegeprep.org' },
      update: {
        hashedPassword: schoolAdminPassword,
        name: 'School System Administrator',
        is_admin: true,
        is_system_admin: false,
        is_school_admin: true,
        two_factor_enabled: false,
        emailVerified: new Date(),
      },
      create: {
        email: 'sysadmin@cjcollegeprep.org',
        name: 'School System Administrator',
        hashedPassword: schoolAdminPassword,
        is_admin: true,
        is_system_admin: false,
        is_school_admin: true,
        two_factor_enabled: false,
        backup_codes: [],
        emailVerified: new Date(),
      },
    });
    
    console.log('✅ School Admin created: sysadmin@cjcollegeprep.org / Admin123!@#');

    // Create test users for different roles
    const testPassword = await bcrypt.hash('test123', 10);
    
    const testUsers = [
      {
        email: 'teacher@school.edu',
        name: 'Test Teacher',
        is_admin: false,
        is_system_admin: false,
        is_school_admin: false,
      },
      {
        email: 'principal@school.edu',
        name: 'Test Principal',
        is_admin: false,
        is_system_admin: false,
        is_school_admin: false,
      },
      {
        email: 'student@school.edu',
        name: 'Test Student',
        is_admin: false,
        is_system_admin: false,
        is_school_admin: false,
      }
    ];

    for (const userData of testUsers) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          hashedPassword: testPassword,
          ...userData,
          emailVerified: new Date(),
        },
        create: {
          ...userData,
          hashedPassword: testPassword,
          two_factor_enabled: false,
          backup_codes: [],
          emailVerified: new Date(),
        },
      });
      console.log(`✅ Test user created: ${userData.email} / test123`);
    }

    // List all users
    console.log('\n📊 Current users in database:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        is_admin: true,
        is_system_admin: true,
        is_school_admin: true,
      },
    });
    
    console.table(allUsers);

    return allUsers;
  } catch (error) {
    console.error('❌ Error restoring admins:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreAdmins()
  .then(() => {
    console.log('\n✨ Admin restoration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to restore admins:', error);
    process.exit(1);
  });
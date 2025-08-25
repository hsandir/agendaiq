const { PrismaClient } = require('@prisma/client');

// Supabase connection
const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    }
  }
});

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data from Supabase...\n');

    // 1. List test users to be removed
    const testEmails = [
      'teacher@school.edu',
      'principal@school.edu', 
      'student@school.edu',
      'user1@test.com',
      'user2@test.com',
      'user3@test.com',
      'test@test.com',
      'dev@agendaiq.com',
      'admin@test.com'
    ];

    console.log('📋 Users to be removed:');
    const usersToRemove = await supabasePrisma.user.findMany({
      where: {
        OR: [
          { email: { contains: '@test.com' }},
          { email: { contains: 'test@' }},
          { email: { in: testEmails }},
          { name: { contains: 'Test' }}
        ]
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.table(usersToRemove);

    if (usersToRemove.length === 0) {
      console.log('✅ No test users found to remove');
    } else {
      console.log(`\n🗑️ Removing ${usersToRemove.length} test users...`);
      
      for (const user of usersToRemove) {
        try {
          // Remove related data first
          await supabasePrisma.session.deleteMany({
            where: { userId: user.id }
          });
          
          await supabasePrisma.account.deleteMany({
            where: { userId: user.id }
          });
          
          await supabasePrisma.device.deleteMany({
            where: { user_id: user.id }
          });
          
          await supabasePrisma.loginHistory.deleteMany({
            where: { user_id: user.id }
          });
          
          await supabasePrisma.staff.deleteMany({
            where: { user_id: user.id }
          });
          
          // Now delete the user
          await supabasePrisma.user.delete({
            where: { id: user.id }
          });
          
          console.log(`  ✅ Removed: ${user.email}`);
        } catch (error) {
          console.log(`  ⚠️ Failed to remove ${user.email}: ${error.message}`);
        }
      }
    }

    // 2. Remove test roles (if any)
    console.log('\n📋 Checking for test roles...');
    const testRoles = await supabasePrisma.role.findMany({
      where: {
        OR: [
          { title: { contains: 'Test' }},
          { title: { contains: 'test' }},
          { title: { contains: 'Demo' }},
          { title: { contains: 'demo' }}
        ]
      },
      select: {
        id: true,
        title: true
      }
    });

    if (testRoles.length > 0) {
      console.table(testRoles);
      console.log(`\n🗑️ Removing ${testRoles.length} test roles...`);
      
      for (const role of testRoles) {
        try {
          // Remove related data
          await supabasePrisma.permission.deleteMany({
            where: { role_id: role.id }
          });
          
          await supabasePrisma.roleHierarchy.deleteMany({
            where: {
              OR: [
                { parent_role_id: role.id },
                { child_role_id: role.id }
              ]
            }
          });
          
          await supabasePrisma.staff.deleteMany({
            where: { role_id: role.id }
          });
          
          // Delete the role
          await supabasePrisma.role.delete({
            where: { id: role.id }
          });
          
          console.log(`  ✅ Removed role: ${role.title}`);
        } catch (error) {
          console.log(`  ⚠️ Failed to remove role ${role.title}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ No test roles found');
    }

    // 3. Remove test meetings (if any)
    console.log('\n📋 Checking for test meetings...');
    const testMeetings = await supabasePrisma.meeting.findMany({
      where: {
        OR: [
          { title: { contains: 'Test' }},
          { title: { contains: 'test' }},
          { title: { contains: 'Demo' }},
          { description: { contains: 'test' }}
        ]
      },
      select: {
        id: true,
        title: true
      }
    });

    if (testMeetings.length > 0) {
      console.table(testMeetings);
      console.log(`\n🗑️ Removing ${testMeetings.length} test meetings...`);
      
      for (const meeting of testMeetings) {
        try {
          // Remove related data
          await supabasePrisma.meetingAgendaItem.deleteMany({
            where: { meeting_id: meeting.id }
          });
          
          await supabasePrisma.meetingAttendee.deleteMany({
            where: { meeting_id: meeting.id }
          });
          
          await supabasePrisma.meetingNote.deleteMany({
            where: { meeting_id: meeting.id }
          });
          
          await supabasePrisma.meetingAuditLog.deleteMany({
            where: { meeting_id: meeting.id }
          });
          
          // Delete the meeting
          await supabasePrisma.meeting.delete({
            where: { id: meeting.id }
          });
          
          console.log(`  ✅ Removed meeting: ${meeting.title}`);
        } catch (error) {
          console.log(`  ⚠️ Failed to remove meeting ${meeting.title}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ No test meetings found');
    }

    // 4. Final verification
    console.log('\n📊 Final database state:');
    
    const userCount = await supabasePrisma.user.count();
    const adminCount = await supabasePrisma.user.count({
      where: { is_admin: true }
    });
    const roleCount = await supabasePrisma.role.count();
    const meetingCount = await supabasePrisma.meeting.count();
    
    console.log(`  Total users: ${userCount}`);
    console.log(`  Admin users: ${adminCount}`);
    console.log(`  Total roles: ${roleCount}`);
    console.log(`  Total meetings: ${meetingCount}`);

    // 5. List remaining admin users
    console.log('\n👤 Remaining admin users:');
    const admins = await supabasePrisma.user.findMany({
      where: { is_admin: true },
      select: {
        email: true,
        name: true,
        is_system_admin: true,
        is_school_admin: true
      }
    });
    
    console.table(admins);

    // 6. List all remaining users (first 10)
    console.log('\n👥 Sample of remaining users (first 10):');
    const sampleUsers = await supabasePrisma.user.findMany({
      take: 10,
      orderBy: { id: 'asc' },
      select: {
        email: true,
        name: true,
        is_admin: true
      }
    });
    
    console.table(sampleUsers);

    return { userCount, adminCount, roleCount, meetingCount };

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await supabasePrisma.$disconnect();
  }
}

// Run cleanup
cleanupTestData()
  .then((results) => {
    console.log('\n✨ Cleanup complete!');
    console.log('\n🔑 Valid login credentials:');
    console.log('  Development Admin: admin@school.edu / 1234');
    console.log('  School Admin: sysadmin@cjcollegeprep.org / Admin123!@#');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
const { PrismaClient } = require('@prisma/client');

// Supabase connection
const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    }
  }
});

async function verifySupabase() {
  try {
    console.log('🔍 Verifying Supabase database schema...\n');
    
    // Test all models
    const models = [
      'user',
      'staff', 
      'role',
      'roleHierarchy',
      'permission',
      'department',
      'school',
      'district',
      'meeting',
      'meetingAgendaItem',
      'meetingActionItem',
      'meetingAttendee',
      'meetingTemplate',
      'meetingTranscript',
      'meetingNote',
      'meetingSearch',
      'meetingAuditLog',
      'auditLog',
      'criticalAuditLog',
      'securityLog',
      'devLog',
      'roleTransition',
      'device',
      'session',
      'account',
      'agendaItemComment',
      'agendaItemAttachment'
    ];

    const results = {
      success: [],
      failed: []
    };

    for (const model of models) {
      try {
        const count = await supabasePrisma[model].count();
        console.log(`✅ ${model.padEnd(25)} - ${count} records`);
        results.success.push({ model, count });
      } catch (error) {
        console.log(`❌ ${model.padEnd(25)} - ${error.message}`);
        results.failed.push({ model, error: error.message });
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successful models: ${results.success.length}`);
    console.log(`   ❌ Failed models: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n⚠️ Failed models:');
      results.failed.forEach(f => console.log(`   - ${f.model}: ${f.error}`));
    }

    // Check for new columns
    console.log('\n🔍 Checking key columns...');
    
    try {
      const user = await supabasePrisma.user.findFirst();
      console.log('User model columns:', user ? Object.keys(user) : 'No users');
    } catch (e) {
      console.log('Could not check user columns:', e.message);
    }

    try {
      const role = await supabasePrisma.role.findFirst();
      console.log('Role model columns:', role ? Object.keys(role) : 'No roles');
    } catch (e) {
      console.log('Could not check role columns:', e.message);
    }

    return results;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await supabasePrisma.$disconnect();
  }
}

verifySupabase()
  .then(results => {
    console.log('\n✨ Verification complete!');
    process.exit(results.failed.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
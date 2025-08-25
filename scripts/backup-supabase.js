const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Supabase connection
const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    }
  }
});

async function backupSupabase() {
  const backupDir = path.join(__dirname, '..', 'backups', 'supabase', new Date().toISOString().split('T')[0]);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {
    timestamp: new Date().toISOString(),
    data: {}
  };

  try {
    console.log('📦 Starting Supabase backup...');
    
    // Backup all tables
    const tables = [
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
      'auditLog',
      'device',
      'session',
      'account'
    ];

    for (const table of tables) {
      try {
        console.log(`  Backing up ${table}...`);
        backup.data[table] = await supabasePrisma[table].findMany();
        console.log(`  ✅ ${table}: ${backup.data[table].length} records`);
      } catch (error) {
        console.log(`  ⚠️ ${table}: ${error.message}`);
      }
    }

    // Save backup to file
    const filename = `backup_${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ Backup completed: ${filepath}`);
    console.log(`📊 Total tables backed up: ${Object.keys(backup.data).length}`);
    
    // Create a summary file
    const summary = {
      timestamp: backup.timestamp,
      tables: {}
    };
    
    for (const [table, data] of Object.entries(backup.data)) {
      summary.tables[table] = data.length;
    }
    
    fs.writeFileSync(
      path.join(backupDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    return filepath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await supabasePrisma.$disconnect();
  }
}

backupSupabase()
  .then(filepath => {
    console.log('\n✨ Backup successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  });
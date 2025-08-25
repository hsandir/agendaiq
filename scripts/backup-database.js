const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('Starting database backup...');
    
    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup all tables
    const tables = [
      'user',
      'role', 
      'district',
      'school',
      'department',
      'staff',
      'meeting',
      'meetingAttendee',
      'meetingAgendaItem',
      'meetingActionItem',
      'meetingNote',
      'agendaItemComment',
      'agendaItemAttachment',
      'meetingTemplate',
      'meetingSearch',
      'meetingTranscript',
      'roleTransition',
      'auditLog',
      'criticalAuditLog',
      'meetingAuditLog',
      'device',
      'account',
      'session',
      'verificationToken'
    ];
    
    const backup = {};
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const data = await prisma[table].findMany();
        backup[table] = data;
        console.log(`✓ Backed up ${table}: ${data.length} records`);
        totalRecords += data.length;
      } catch (error) {
        console.log(`⚠ Skipped ${table}: ${error.message}`);
      }
    }
    
    // Save backup to file
    const backupFile = path.join(backupDir, 'database-backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`\n✅ Backup completed successfully\!`);
    console.log(`📁 Location: ${backupFile}`);
    console.log(`📊 Total records: ${totalRecords}`);
    
    // Create restore script
    const restoreScript = `
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreDatabase() {
  try {
    const backupFile = path.join(__dirname, 'database-backup.json');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
    
    console.log('Starting database restore...');
    
    // Restore in correct order to handle foreign keys
    const restoreOrder = [
      'role', 'district', 'school', 'department', 'user',
      'staff', 'meeting', 'meetingAttendee', 'meetingAgendaItem',
      'meetingActionItem', 'meetingNote', 'agendaItemComment',
      'agendaItemAttachment', 'meetingTemplate', 'meetingSearch',
      'meetingTranscript', 'roleTransition', 'auditLog',
      'criticalAuditLog', 'meetingAuditLog', 'device',
      'account', 'session', 'verificationToken'
    ];
    
    for (const table of restoreOrder) {
      if (backup[table] && backup[table].length > 0) {
        try {
          // Clear existing data
          await prisma[table].deleteMany();
          
          // Restore data
          for (const record of backup[table]) {
            await prisma[table].create({ data: record });
          }
          
          console.log(\`✓ Restored \${table}: \${backup[table].length} records\`);
        } catch (error) {
          console.log(\`⚠ Error restoring \${table}: \${error.message}\`);
        }
      }
    }
    
    console.log('\\n✅ Restore completed\!');
  } catch (error) {
    console.error('Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
`;
    
    const restoreFile = path.join(backupDir, 'restore-database.js');
    fs.writeFileSync(restoreFile, restoreScript);
    console.log(`📝 Restore script: ${restoreFile}`);
    
    // Create summary file
    const summary = {
      timestamp: new Date().toISOString(),
      totalTables: Object.keys(backup).length,
      totalRecords: totalRecords,
      tables: Object.keys(backup).map(table => ({
        name: table,
        records: backup[table].length
      }))
    };
    
    const summaryFile = path.join(backupDir, 'backup-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📋 Summary: ${summaryFile}`);
    
  } catch (error) {
    console.error('Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();

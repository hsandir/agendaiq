
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
          
          console.log(`✓ Restored ${table}: ${backup[table].length} records`);
        } catch (error) {
          console.log(`⚠ Error restoring ${table}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Restore completed!');
  } catch (error) {
    console.error('Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();

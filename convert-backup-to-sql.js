const fs = require('fs');

function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (Array.isArray(value)) {
    return `'{${value.map(v => escapeValue(v).replace(/'/g, '')).join(',')}}'`;
  }
  if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))) {
    return `'${value}'`;
  }
  return value.toString();
}

function generateInsertSQL(tableName, records) {
  if (!records || records.length === 0) return '';
  
  const columns = Object.keys(records[0]);
  let sql = `-- Insert ${tableName}\n`;
  
  for (const record of records) {
    const values = columns.map(col => escapeValue(record[col])).join(', ');
    sql += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values});\n`;
  }
  
  return sql + '\n';
}

function main() {
  const backupData = JSON.parse(
    fs.readFileSync('./backups/2025-08-09T07-04-04-465Z/database-backup.json', 'utf8')
  );

  let sqlScript = `-- Database Restore Script
-- Generated from backup: 2025-08-09T07-04-04-465Z

BEGIN;

-- Disable triggers to avoid foreign key issues
SET session_replication_role = replica;

`;

  // Generate inserts in proper order (respecting foreign keys)
  sqlScript += generateInsertSQL('District', backupData.district);
  sqlScript += generateInsertSQL('School', backupData.school);
  sqlScript += generateInsertSQL('Department', backupData.department);
  sqlScript += generateInsertSQL('Role', backupData.role);
  sqlScript += generateInsertSQL('users', backupData.user);
  sqlScript += generateInsertSQL('Staff', backupData.staff);
  if (backupData.meeting) sqlScript += generateInsertSQL('Meeting', backupData.meeting);
  if (backupData.meetingAttendee) sqlScript += generateInsertSQL('MeetingAttendee', backupData.meetingAttendee);
  if (backupData.meetingAgendaItem) sqlScript += generateInsertSQL('meeting_agenda_items', backupData.meetingAgendaItem);
  if (backupData.auditLog) sqlScript += generateInsertSQL('audit_logs', backupData.auditLog);

  sqlScript += `
-- Update sequences
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('"District_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "District"));
SELECT setval('"School_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "School"));
SELECT setval('"Department_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Department"));
SELECT setval('"Role_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Role"));
SELECT setval('"Staff_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Staff"));
SELECT setval('"Meeting_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Meeting"));
SELECT setval('"MeetingAttendee_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "MeetingAttendee"));

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
`;

  fs.writeFileSync('./restore-backup.sql', sqlScript);
  console.log('SQL restore script generated: restore-backup.sql');
}

main();
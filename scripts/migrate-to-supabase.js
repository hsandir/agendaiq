#!/usr/bin/env node

const { PrismaClient: LocalPrisma } = require('@prisma/client');
const { PrismaClient: SupabasePrisma } = require('@prisma/client');

// Configuration
const LOCAL_DATABASE_URL = 'postgresql://hs:yeni@localhost:5432/agendaiq';
const SUPABASE_DATABASE_URL = 'postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const SUPABASE_DIRECT_URL = 'postgresql://postgres:s%3Fr%26v6vXSCEc_8A@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres';

// Initialize Prisma clients
const localPrisma = new LocalPrisma({
  datasources: {
    db: {
      url: LOCAL_DATABASE_URL
    }
  }
});

const supabasePrisma = new SupabasePrisma({
  datasources: {
    db: {
      url: SUPABASE_DIRECT_URL // Use direct URL for data migration
    }
  }
});

async function countRecords(prisma, tableName) {
  try {
    const count = await prisma[tableName].count();
    return count;
  } catch (error) {
    return 0;
  }
}

async function clearSupabaseData() {
  console.log('\n🗑️  Clearing Supabase database...');
  
  // Delete in correct order to respect foreign key constraints
  const tables = [
    'meetingSearch',
    'meetingTranscript',
    'meetingActionItem',
    'agendaItemComment',
    'agendaItemAttachment',
    'meetingAgendaItem',
    'meetingAuditLog',
    'meetingNote',
    'meetingAttendee',
    'meeting',
    'meetingTemplate',
    'roleTransition',
    'device',
    'verificationToken',
    'session',
    'account',
    'auditLog',
    'criticalAuditLog',
    'staff',
    'user',
    'roleHierarchy',
    'role',
    'department',
    'school',
    'district',
    'systemSetting'
  ];

  for (const table of tables) {
    try {
      const count = await countRecords(supabasePrisma, table);
      if (count > 0) {
        await supabasePrisma[table].deleteMany();
        console.log(`  ✅ Cleared ${table} (${count} records)`);
      }
    } catch (error) {
      console.log(`  ⏭️  Skipped ${table} (not found or empty)`);
    }
  }
}

async function migrateTable(tableName, options = {}) {
  try {
    console.log(`\n📋 Migrating ${tableName}...`);
    
    // Get data from local
    const localData = await localPrisma[tableName].findMany();
    console.log(`  📊 Found ${localData.length} records in local`);
    
    if (localData.length === 0) {
      console.log(`  ⏭️  No data to migrate`);
      return { table: tableName, migrated: 0, status: 'skipped' };
    }

    // Clear existing data in Supabase for this table
    if (!options.skipClear) {
      const existingCount = await countRecords(supabasePrisma, tableName);
      if (existingCount > 0) {
        await supabasePrisma[tableName].deleteMany();
        console.log(`  🗑️  Cleared ${existingCount} existing records`);
      }
    }

    // Insert data to Supabase
    let migrated = 0;
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < localData.length; i += batchSize) {
      const batch = localData.slice(i, i + batchSize);
      
      try {
        if (options.useCreateMany !== false) {
          // Try createMany first (faster)
          await supabasePrisma[tableName].createMany({
            data: batch,
            skipDuplicates: true
          });
          migrated += batch.length;
        } else {
          // Fall back to individual creates
          for (const record of batch) {
            try {
              await supabasePrisma[tableName].create({ data: record });
              migrated++;
            } catch (error) {
              console.log(`  ⚠️  Failed to migrate record:`, error.message);
            }
          }
        }
        
        console.log(`  ⏳ Progress: ${migrated}/${localData.length}`);
      } catch (error) {
        console.log(`  ⚠️  Batch error, trying individual inserts...`);
        // Fall back to individual inserts
        for (const record of batch) {
          try {
            await supabasePrisma[tableName].create({ data: record });
            migrated++;
          } catch (error) {
            console.log(`  ❌ Failed record:`, error.message);
          }
        }
      }
    }

    console.log(`  ✅ Migrated ${migrated}/${localData.length} records`);
    return { table: tableName, migrated, total: localData.length, status: 'success' };
    
  } catch (error) {
    console.log(`  ❌ Error migrating ${tableName}:`, error.message);
    return { table: tableName, migrated: 0, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('=====================================');
  console.log('Local to Supabase Migration Tool');
  console.log('=====================================');
  
  try {
    // Test connections
    console.log('\n🔌 Testing connections...');
    
    // Test local connection
    const localUsers = await localPrisma.user.count();
    console.log(`  ✅ Local DB connected (${localUsers} users)`);
    
    // Test Supabase connection
    await supabasePrisma.$queryRaw`SELECT 1`;
    console.log('  ✅ Supabase connected');

    // Ask for confirmation
    const args = process.argv.slice(2);
    const skipConfirm = args.includes('--yes') || args.includes('-y');
    
    if (!skipConfirm) {
      console.log('\n⚠️  WARNING: This will REPLACE all data in Supabase!');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Clear Supabase data
    const skipClear = args.includes('--skip-clear');
    if (!skipClear) {
      await clearSupabaseData();
    }

    // Migration order (respecting foreign key constraints)
    const migrationOrder = [
      // Base tables (no foreign keys)
      { name: 'district', options: {} },
      { name: 'systemSetting', options: {} },
      
      // Second level (depend on base)
      { name: 'school', options: {} },
      { name: 'user', options: {} },
      
      // Third level
      { name: 'department', options: {} },
      { name: 'role', options: {} },
      
      // Fourth level
      { name: 'roleHierarchy', options: {} },
      { name: 'staff', options: {} },
      { name: 'account', options: {} },
      { name: 'session', options: {} },
      { name: 'device', options: {} },
      { name: 'verificationToken', options: {} },
      { name: 'meetingTemplate', options: {} },
      
      // Meeting related
      { name: 'meeting', options: {} },
      { name: 'meetingAttendee', options: {} },
      { name: 'meetingNote', options: {} },
      { name: 'meetingAgendaItem', options: {} },
      { name: 'meetingActionItem', options: {} },
      { name: 'agendaItemAttachment', options: {} },
      { name: 'agendaItemComment', options: {} },
      { name: 'meetingAuditLog', options: {} },
      { name: 'meetingTranscript', options: {} },
      { name: 'meetingSearch', options: {} },
      
      // Audit and logs
      { name: 'auditLog', options: {} },
      { name: 'criticalAuditLog', options: {} },
      { name: 'roleTransition', options: {} }
    ];

    console.log(`\n🚀 Starting migration of ${migrationOrder.length} tables...`);
    
    const results = [];
    for (const { name, options } of migrationOrder) {
      const result = await migrateTable(name, options);
      results.push(result);
    }

    // Summary
    console.log('\n=====================================');
    console.log('Migration Summary');
    console.log('=====================================');
    
    let totalMigrated = 0;
    let totalRecords = 0;
    let successCount = 0;
    
    for (const result of results) {
      const status = result.status === 'success' ? '✅' : 
                     result.status === 'skipped' ? '⏭️' : '❌';
      
      if (result.status === 'success') {
        totalMigrated += result.migrated;
        totalRecords += result.total;
        successCount++;
        console.log(`${status} ${result.table}: ${result.migrated}/${result.total} records`);
      } else if (result.status === 'skipped') {
        console.log(`${status} ${result.table}: No data`);
      } else {
        console.log(`${status} ${result.table}: ${result.error || 'Failed'}`);
      }
    }
    
    console.log('\n📊 Final Statistics:');
    console.log(`  Total Tables: ${migrationOrder.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Total Records Migrated: ${totalMigrated}/${totalRecords}`);
    console.log(`  Success Rate: ${totalRecords > 0 ? Math.round(totalMigrated/totalRecords * 100) : 0}%`);
    
    // Verify critical tables
    console.log('\n🔍 Verifying critical tables in Supabase...');
    const criticalTables = ['user', 'staff', 'role', 'district', 'school', 'department'];
    
    for (const table of criticalTables) {
      const count = await countRecords(supabasePrisma, table);
      console.log(`  ${table}: ${count} records`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  }
}

// Run migration
main().catch(console.error);
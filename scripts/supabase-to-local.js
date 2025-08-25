/**
 * Script to safely copy data from Supabase to local database
 * NEVER modifies Supabase data - READ ONLY
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Create two separate Prisma clients
const localPrisma = new PrismaClient();

// Create Supabase client with proper connection string
async function getSupabaseClient() {
  // Try different connection methods
  const connections = [
    {
      name: 'Pooled Connection',
      url: 'postgresql://postgres.tvhqasooledcffwogbvd:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
    },
    {
      name: 'Direct Connection', 
      url: 'postgresql://postgres.tvhqasooledcffwogbvd:[PASSWORD]@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres'
    }
  ];

  // Password from .env file (URL encoded)
  const password = 's%3Fr%26v6vXSCEc_8A';
  
  for (const conn of connections) {
    console.log(`\n🔄 Trying ${conn.name}...`);
    
    // Set environment variable temporarily
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = conn.url.replace('[PASSWORD]', password);
    
    try {
      const client = new PrismaClient();
      
      // Test connection
      const count = await client.user.count();
      console.log(`✅ Connected to Supabase via ${conn.name}! Found ${count} users`);
      
      // Restore original URL
      process.env.DATABASE_URL = originalUrl;
      return client;
      
    } catch (error) {
      console.log(`❌ ${conn.name} failed:`, error.message);
      process.env.DATABASE_URL = originalUrl;
    }
  }
  
  throw new Error('Could not connect to Supabase');
}

async function copySupabaseToLocal() {
  console.log('🚀 Starting Supabase to Local Database Transfer');
  console.log('📋 This script will:');
  console.log('  1. READ data from Supabase (no modifications)');
  console.log('  2. BACKUP local database');
  console.log('  3. COPY data to local database');
  console.log('');

  try {
    // Get Supabase client
    const supabasePrisma = await getSupabaseClient();
    
    // Check Supabase data
    console.log('\n📊 Checking Supabase data...');
    const [
      supabaseUsers,
      supabaseStaff,
      supabaseRoles,
      supabaseDepartments,
      supabaseSchools,
      supabaseDistricts,
      supabaseMeetings
    ] = await Promise.all([
      supabasePrisma.user.count(),
      supabasePrisma.staff.count(),
      supabasePrisma.role.count(),
      supabasePrisma.department.count(),
      supabasePrisma.school.count(),
      supabasePrisma.district.count(),
      supabasePrisma.meeting.count()
    ]);
    
    console.log('Supabase Database Status:');
    console.log(`  Users: ${supabaseUsers}`);
    console.log(`  Staff: ${supabaseStaff}`);
    console.log(`  Roles: ${supabaseRoles}`);
    console.log(`  Departments: ${supabaseDepartments}`);
    console.log(`  Schools: ${supabaseSchools}`);
    console.log(`  Districts: ${supabaseDistricts}`);
    console.log(`  Meetings: ${supabaseMeetings}`);
    
    if (supabaseUsers === 0) {
      console.log('\n⚠️ WARNING: Supabase appears to be empty!');
      console.log('No data to transfer.');
      
      // Check if we have the CJCP seed data locally
      const localUsers = await localPrisma.user.count();
      if (localUsers === 50) {
        console.log('\n✅ Local database already has 50 users (CJCP Somerset data)');
        console.log('No transfer needed.');
      }
      
      await supabasePrisma.$disconnect();
      await localPrisma.$disconnect();
      return;
    }
    
    // Backup local database first
    console.log('\n💾 Creating local database backup...');
    const backupFile = `backup_before_supabase_import_${Date.now()}.sql`;
    try {
      execSync(`pg_dump -U hs agendaiq > ${backupFile}`);
      console.log(`✅ Backup saved to: ${backupFile}`);
    } catch (e) {
      console.log('⚠️ Backup command failed, but continuing...');
    }
    
    // Start transferring data
    console.log('\n📥 Starting data transfer from Supabase to Local...');
    
    // Transfer in correct order (respecting foreign keys)
    
    // 1. Districts
    console.log('\n📍 Transferring Districts...');
    const districts = await supabasePrisma.district.findMany();
    if (districts.length > 0) {
      await localPrisma.district.deleteMany({});
      for (const district of districts) {
        await localPrisma.district.create({ data: district });
      }
      console.log(`  ✅ Transferred ${districts.length} districts`);
    }
    
    // 2. Schools
    console.log('\n🏫 Transferring Schools...');
    const schools = await supabasePrisma.school.findMany();
    if (schools.length > 0) {
      await localPrisma.school.deleteMany({});
      for (const school of schools) {
        await localPrisma.school.create({ data: school });
      }
      console.log(`  ✅ Transferred ${schools.length} schools`);
    }
    
    // 3. Departments
    console.log('\n🏢 Transferring Departments...');
    const departments = await supabasePrisma.department.findMany();
    if (departments.length > 0) {
      await localPrisma.department.deleteMany({});
      for (const dept of departments) {
        await localPrisma.department.create({ data: dept });
      }
      console.log(`  ✅ Transferred ${departments.length} departments`);
    }
    
    // 4. Roles
    console.log('\n👔 Transferring Roles...');
    const roles = await supabasePrisma.role.findMany();
    if (roles.length > 0) {
      await localPrisma.role.deleteMany({});
      for (const role of roles) {
        await localPrisma.role.create({ data: role });
      }
      console.log(`  ✅ Transferred ${roles.length} roles`);
    }
    
    // 5. Users
    console.log('\n👥 Transferring Users...');
    const users = await supabasePrisma.user.findMany();
    if (users.length > 0) {
      await localPrisma.staff.deleteMany({}); // Clear staff first
      await localPrisma.user.deleteMany({});
      for (const user of users) {
        await localPrisma.user.create({ data: user });
      }
      console.log(`  ✅ Transferred ${users.length} users`);
    }
    
    // 6. Staff
    console.log('\n👨‍💼 Transferring Staff...');
    const staff = await supabasePrisma.staff.findMany();
    if (staff.length > 0) {
      for (const s of staff) {
        await localPrisma.staff.create({ data: s });
      }
      console.log(`  ✅ Transferred ${staff.length} staff members`);
    }
    
    // 7. Meetings (if any)
    if (supabaseMeetings > 0) {
      console.log('\n📅 Transferring Meetings...');
      const meetings = await supabasePrisma.meeting.findMany();
      await localPrisma.meeting.deleteMany({});
      for (const meeting of meetings) {
        await localPrisma.meeting.create({ data: meeting });
      }
      console.log(`  ✅ Transferred ${meetings.length} meetings`);
    }
    
    // Final verification
    console.log('\n✅ Transfer Complete! Verifying local database...');
    const [
      localUsers,
      localStaff,
      localRoles,
      localDepartments
    ] = await Promise.all([
      localPrisma.user.count(),
      localPrisma.staff.count(),
      localPrisma.role.count(),
      localPrisma.department.count()
    ]);
    
    console.log('\n📊 Local Database Status:');
    console.log(`  Users: ${localUsers}`);
    console.log(`  Staff: ${localStaff}`);
    console.log(`  Roles: ${localRoles}`);
    console.log(`  Departments: ${localDepartments}`);
    
    // Show some sample data
    const sampleUsers = await localPrisma.user.findMany({
      take: 5,
      orderBy: { id: 'asc' }
    });
    
    console.log('\n👥 Sample Users in Local:');
    sampleUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name || 'No name'})`);
    });
    
    await supabasePrisma.$disconnect();
    await localPrisma.$disconnect();
    
    console.log('\n🎉 SUCCESS! Supabase data has been copied to local database.');
    console.log('📝 Note: Supabase was NOT modified - only READ operations were performed.');
    
  } catch (error) {
    console.error('\n❌ Error during transfer:', error);
    console.error('Details:', error.message);
    
    // Cleanup
    try {
      await localPrisma.$disconnect();
    } catch {}
  }
}

// Run the transfer
copySupabaseToLocal();
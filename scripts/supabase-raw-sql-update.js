const { PrismaClient } = require('@prisma/client');

// Supabase connection
const SUPABASE_DIRECT_URL = 'postgresql://postgres:s%3Fr%26v6vXSCEc_8A@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres';

const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: SUPABASE_DIRECT_URL
    }
  }
});

async function updateSupabaseWithRawSQL() {
  console.log('🔄 Updating Supabase admin roles with raw SQL...\n');
  
  try {
    // Test connection
    console.log('📡 Connecting to Supabase...');
    await supabasePrisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected successfully!\n');
    
    // 1. Update roles
    console.log('📋 Updating roles...');
    
    // Update System Administrator role
    await supabasePrisma.$executeRaw`
      UPDATE "Role" 
      SET key = 'OPS_ADMIN', priority = 1, is_leadership = true 
      WHERE title = 'System Administrator'
    `;
    console.log('✅ Updated System Administrator role');
    
    // Update Administrator role to DEV_ADMIN
    await supabasePrisma.$executeRaw`
      UPDATE "Role" 
      SET key = 'DEV_ADMIN', title = 'Development Admin', priority = 0, is_leadership = true 
      WHERE title = 'Administrator' OR key = 'DEV_ADMIN'
    `;
    console.log('✅ Updated Development Admin role');
    
    // 2. Update user flags
    console.log('\n📧 Updating user flags...');
    
    // Update admin@school.edu
    await supabasePrisma.$executeRaw`
      UPDATE users 
      SET is_system_admin = true, is_school_admin = false, name = 'Development Admin'
      WHERE email = 'admin@school.edu'
    `;
    console.log('✅ Updated admin@school.edu');
    
    // Update sysadmin@cjcollegeprep.org
    await supabasePrisma.$executeRaw`
      UPDATE users 
      SET is_system_admin = false, is_school_admin = true, name = 'School System Administrator'
      WHERE email = 'sysadmin@cjcollegeprep.org'
    `;
    console.log('✅ Updated sysadmin@cjcollegeprep.org');
    
    // 3. Update staff roles
    console.log('\n🔧 Updating staff roles...');
    
    // Get role IDs
    const devAdminRole = await supabasePrisma.$queryRaw`
      SELECT id FROM "Role" WHERE key = 'DEV_ADMIN' LIMIT 1
    `;
    
    const opsAdminRole = await supabasePrisma.$queryRaw`
      SELECT id FROM "Role" WHERE key = 'OPS_ADMIN' LIMIT 1
    `;
    
    if (devAdminRole[0]) {
      await supabasePrisma.$executeRaw`
        UPDATE "Staff" 
        SET role_id = ${devAdminRole[0].id}
        WHERE user_id = (SELECT id FROM users WHERE email = 'admin@school.edu')
      `;
      console.log('✅ Updated admin@school.edu staff to DEV_ADMIN');
    }
    
    if (opsAdminRole[0]) {
      await supabasePrisma.$executeRaw`
        UPDATE "Staff" 
        SET role_id = ${opsAdminRole[0].id}
        WHERE user_id = (SELECT id FROM users WHERE email = 'sysadmin@cjcollegeprep.org')
      `;
      console.log('✅ Updated sysadmin@cjcollegeprep.org staff to OPS_ADMIN');
    }
    
    // 4. Verify changes
    console.log('\n📊 Verification:');
    console.log('='.repeat(50));
    
    const admins = await supabasePrisma.$queryRaw`
      SELECT 
        u.email,
        u.name,
        u.is_system_admin,
        u.is_school_admin,
        r.title as role_title,
        r.key as role_key,
        r.priority
      FROM users u
      LEFT JOIN "Staff" s ON u.id = s.user_id
      LEFT JOIN "Role" r ON s.role_id = r.id
      WHERE u.email IN ('admin@school.edu', 'sysadmin@cjcollegeprep.org')
    `;
    
    console.log('\nAdmin Users in Supabase:');
    for (const admin of admins) {
      console.log(`\n${admin.email}:`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  System Admin: ${admin.is_system_admin ? '✅' : '❌'}`);
      console.log(`  School Admin: ${admin.is_school_admin ? '✅' : '❌'}`);
      console.log(`  Role: ${admin.role_title}`);
      console.log(`  Role Key: ${admin.role_key || 'NOT SET'}`);
      console.log(`  Priority: ${admin.priority}`);
    }
    
    // Check all roles with keys
    const rolesWithKeys = await supabasePrisma.$queryRaw`
      SELECT key, title, priority 
      FROM "Role" 
      WHERE key IS NOT NULL 
      ORDER BY priority
    `;
    
    console.log('\n📋 Roles with Keys in Supabase:');
    for (const role of rolesWithKeys) {
      console.log(`  ${role.title}: ${role.key} (priority: ${role.priority})`);
    }
    
    console.log('\n✨ Supabase admin roles updated successfully!');
    console.log('\nConfiguration:');
    console.log('  admin@school.edu → DEV_ADMIN (Development Admin)');
    console.log('  sysadmin@cjcollegeprep.org → OPS_ADMIN (School Admin)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await supabasePrisma.$disconnect();
  }
}

updateSupabaseWithRawSQL().catch(console.error);
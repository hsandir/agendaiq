const { PrismaClient } = require('@prisma/client');

// Supabase connection with correct encoded password
const SUPABASE_DATABASE_URL = 'postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const SUPABASE_DIRECT_URL = 'postgresql://postgres:s%3Fr%26v6vXSCEc_8A@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres';

async function fixSupabaseAdmins() {
  console.log('🔄 Fixing Supabase admin roles...\n');
  
  // Try pooler connection first
  let supabasePrisma = new PrismaClient({
    datasources: {
      db: {
        url: SUPABASE_DATABASE_URL
      }
    }
  });
  
  try {
    console.log('📡 Connecting to Supabase (pooler)...');
    const test = await supabasePrisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected successfully!\n');
  } catch (error) {
    console.log('⚠️ Pooler connection failed, trying direct connection...');
    await supabasePrisma.$disconnect();
    
    // Try direct connection
    supabasePrisma = new PrismaClient({
      datasources: {
        db: {
          url: SUPABASE_DIRECT_URL
        }
      }
    });
    
    try {
      const test = await supabasePrisma.$queryRaw`SELECT 1`;
      console.log('✅ Connected via direct URL!\n');
    } catch (directError) {
      console.error('❌ Both connections failed:', directError.message);
      process.exit(1);
    }
  }
  
  try {
    // 1. Update/Create roles
    console.log('📋 Updating roles...');
    
    // Update System Administrator role
    let sysAdminRole = await supabasePrisma.role.findFirst({
      where: { title: 'System Administrator' }
    });
    
    if (sysAdminRole) {
      sysAdminRole = await supabasePrisma.role.update({
        where: { id: sysAdminRole.id },
        data: {
          key: 'OPS_ADMIN',
          priority: 1,
          is_leadership: true,
          is_supervisor: true
        }
      });
      console.log('✅ Updated System Administrator role with OPS_ADMIN key');
    } else {
      sysAdminRole = await supabasePrisma.role.create({
        data: {
          key: 'OPS_ADMIN',
          title: 'System Administrator',
          priority: 1,
          is_leadership: true,
          is_supervisor: true,
          category: 'ADMIN'
        }
      });
      console.log('✅ Created System Administrator role');
    }
    
    // Create/Update Development Admin role
    let devAdminRole = await supabasePrisma.role.findFirst({
      where: { 
        OR: [
          { key: 'DEV_ADMIN' },
          { title: 'Development Admin' },
          { title: 'Administrator' }  // Also check for Administrator role
        ]
      }
    });
    
    if (devAdminRole) {
      // Update existing role to be DEV_ADMIN
      devAdminRole = await supabasePrisma.role.update({
        where: { id: devAdminRole.id },
        data: {
          key: 'DEV_ADMIN',
          title: 'Development Admin',
          priority: 0,
          is_leadership: true,
          is_supervisor: true,
          category: 'ADMIN'
        }
      });
      console.log('✅ Updated existing role to Development Admin');
    } else {
      // Create new role
      const maxId = await supabasePrisma.role.findMany({
        orderBy: { id: 'desc' },
        take: 1,
        select: { id: true }
      });
      
      const newId = (maxId[0]?.id || 0) + 1;
      
      devAdminRole = await supabasePrisma.role.create({
        data: {
          id: newId,
          key: 'DEV_ADMIN',
          title: 'Development Admin',
          priority: 0,
          is_leadership: true,
          is_supervisor: true,
          category: 'ADMIN'
        }
      });
      console.log('✅ Created Development Admin role');
    }
    
    // 2. Update admin users
    console.log('\n📧 Updating admin users...');
    
    // Update admin@school.edu
    const adminUser = await supabasePrisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (adminUser) {
      await supabasePrisma.user.update({
        where: { id: adminUser.id },
        data: {
          name: 'Development Admin',
          is_system_admin: true,
          is_school_admin: false
        }
      });
      console.log('✅ Updated admin@school.edu flags');
      
      // Update staff record
      const adminStaff = await supabasePrisma.staff.findFirst({
        where: { user_id: adminUser.id }
      });
      
      if (adminStaff) {
        await supabasePrisma.staff.update({
          where: { id: adminStaff.id },
          data: {
            role_id: devAdminRole.id,
            first_name: 'Development',
            last_name: 'Admin'
          }
        });
        console.log('✅ Updated admin@school.edu staff to DEV_ADMIN role');
      }
    } else {
      console.log('⚠️ admin@school.edu not found in Supabase');
    }
    
    // Update sysadmin@cjcollegeprep.org
    const sysadminUser = await supabasePrisma.user.findUnique({
      where: { email: 'sysadmin@cjcollegeprep.org' }
    });
    
    if (sysadminUser) {
      await supabasePrisma.user.update({
        where: { id: sysadminUser.id },
        data: {
          name: 'School System Administrator',
          is_system_admin: false,
          is_school_admin: true
        }
      });
      console.log('✅ Updated sysadmin@cjcollegeprep.org flags');
      
      // Update staff record
      const sysadminStaff = await supabasePrisma.staff.findFirst({
        where: { user_id: sysadminUser.id }
      });
      
      if (sysadminStaff) {
        await supabasePrisma.staff.update({
          where: { id: sysadminStaff.id },
          data: {
            role_id: sysAdminRole.id,
            first_name: 'School',
            last_name: 'Administrator'
          }
        });
        console.log('✅ Updated sysadmin@cjcollegeprep.org staff to OPS_ADMIN role');
      }
    } else {
      console.log('⚠️ sysadmin@cjcollegeprep.org not found in Supabase');
    }
    
    // 3. Verify changes
    console.log('\n📊 Verification:');
    console.log('='.repeat(50));
    
    const admins = await supabasePrisma.user.findMany({
      where: {
        email: { in: ['admin@school.edu', 'sysadmin@cjcollegeprep.org'] }
      },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    for (const admin of admins) {
      console.log(`\n${admin.email}:`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  System Admin: ${admin.is_system_admin ? '✅' : '❌'}`);
      console.log(`  School Admin: ${admin.is_school_admin ? '✅' : '❌'}`);
      if (admin.Staff && admin.Staff[0]) {
        console.log(`  Role: ${admin.Staff[0].Role.title}`);
        console.log(`  Role Key: ${admin.Staff[0].Role.key || 'NOT SET'}`);
        console.log(`  Priority: ${admin.Staff[0].Role.priority}`);
      }
    }
    
    // Check all roles with keys
    const rolesWithKeys = await supabasePrisma.role.findMany({
      where: {
        key: { not: null }
      },
      select: {
        key: true,
        title: true,
        priority: true
      },
      orderBy: {
        priority: 'asc'
      }
    });
    
    console.log('\n📋 Roles with Keys in Supabase:');
    for (const role of rolesWithKeys) {
      console.log(`  ${role.title}: ${role.key} (priority: ${role.priority})`);
    }
    
    console.log('\n✨ Supabase admin roles fixed successfully!');
    console.log('\nConfiguration:');
    console.log('  admin@school.edu → DEV_ADMIN (Development Admin)');
    console.log('  sysadmin@cjcollegeprep.org → OPS_ADMIN (School Admin)');
    
  } catch (error) {
    console.error('❌ Error updating Supabase:', error);
  } finally {
    await supabasePrisma.$disconnect();
  }
}

fixSupabaseAdmins().catch(console.error);
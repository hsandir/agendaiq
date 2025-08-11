const { PrismaClient } = require('@prisma/client');

// Local database
const localPrisma = new PrismaClient();

// Supabase database - READ ONLY as per CLAUDE.md policy
// WARNING: This script performs WRITE operations which violate the Supabase READ-ONLY policy
// Only use with explicit approval and understanding of consequences

if (process.env.ALLOW_SUPABASE_WRITE !== 'ABSOLUTELY_CERTAIN_I_UNDERSTAND_THE_RISKS') {
  console.error('❌ SUPABASE WRITE OPERATIONS ARE FORBIDDEN!');
  console.error('Per CLAUDE.md policy, Supabase must remain READ-ONLY.');
  console.error('If you absolutely must write, set ALLOW_SUPABASE_WRITE=ABSOLUTELY_CERTAIN_I_UNDERSTAND_THE_RISKS');
  process.exit(1);
}

const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SUPABASE_DATABASE_URL || "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    }
  }
});

async function syncToSupabase() {
  try {
    console.log('🔄 Syncing data to Supabase...\n');

    // 1. Sync Users (especially admins)
    console.log('📤 Syncing users...');
    const adminUsers = await localPrisma.user.findMany({
      where: {
        OR: [
          { email: 'admin@school.edu' },
          { email: 'sysadmin@cjcollegeprep.org' },
          { is_admin: true }
        ]
      }
    });

    for (const user of adminUsers) {
      try {
        await supabasePrisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            hashedPassword: user.hashedPassword,
            is_admin: user.is_admin,
            is_system_admin: user.is_system_admin,
            is_school_admin: user.is_school_admin,
            emailVerified: user.emailVerified,
            two_factor_enabled: user.two_factor_enabled,
            backup_codes: user.backup_codes,
          },
          create: {
            email: user.email,
            name: user.name,
            hashedPassword: user.hashedPassword,
            is_admin: user.is_admin,
            is_system_admin: user.is_system_admin,
            is_school_admin: user.is_school_admin,
            emailVerified: user.emailVerified,
            two_factor_enabled: user.two_factor_enabled,
            backup_codes: user.backup_codes || [],
          }
        });
        console.log(`  ✅ User synced: ${user.email}`);
      } catch (error) {
        console.log(`  ⚠️ Failed to sync user ${user.email}: ${error.message}`);
      }
    }

    // 2. Sync RoleHierarchy
    console.log('\n📤 Syncing role hierarchy...');
    const roleHierarchies = await localPrisma.roleHierarchy.findMany();
    
    for (const hierarchy of roleHierarchies) {
      try {
        await supabasePrisma.roleHierarchy.upsert({
          where: {
            parent_role_id_child_role_id: {
              parent_role_id: hierarchy.parent_role_id,
              child_role_id: hierarchy.child_role_id
            }
          },
          update: {
            hierarchy_level: hierarchy.hierarchy_level
          },
          create: {
            parent_role_id: hierarchy.parent_role_id,
            child_role_id: hierarchy.child_role_id,
            hierarchy_level: hierarchy.hierarchy_level
          }
        });
        console.log(`  ✅ Hierarchy synced: ${hierarchy.parent_role_id} -> ${hierarchy.child_role_id}`);
      } catch (error) {
        console.log(`  ⚠️ Failed to sync hierarchy: ${error.message}`);
      }
    }

    // 3. Sync Permissions
    console.log('\n📤 Syncing permissions...');
    const permissions = await localPrisma.permission.findMany();
    
    for (const permission of permissions) {
      try {
        await supabasePrisma.permission.upsert({
          where: {
            role_id_capability: {
              role_id: permission.role_id,
              capability: permission.capability
            }
          },
          update: {
            resource: permission.resource,
            action: permission.action,
            conditions: permission.conditions
          },
          create: {
            role_id: permission.role_id,
            capability: permission.capability,
            resource: permission.resource,
            action: permission.action,
            conditions: permission.conditions
          }
        });
        console.log(`  ✅ Permission synced: ${permission.capability} for role ${permission.role_id}`);
      } catch (error) {
        console.log(`  ⚠️ Failed to sync permission: ${error.message}`);
      }
    }

    // 4. Verify sync
    console.log('\n📊 Verifying Supabase data...');
    
    const supabaseUsers = await supabasePrisma.user.count();
    const supabaseHierarchies = await supabasePrisma.roleHierarchy.count();
    const supabasePermissions = await supabasePrisma.permission.count();
    const supabaseRoles = await supabasePrisma.role.count();
    
    console.log(`  Users: ${supabaseUsers}`);
    console.log(`  Role Hierarchies: ${supabaseHierarchies}`);
    console.log(`  Permissions: ${supabasePermissions}`);
    console.log(`  Roles: ${supabaseRoles}`);

    // 5. Test admin users
    console.log('\n🔑 Admin users in Supabase:');
    const supabaseAdmins = await supabasePrisma.user.findMany({
      where: { is_admin: true },
      select: {
        email: true,
        name: true,
        is_system_admin: true,
        is_school_admin: true
      }
    });
    
    console.table(supabaseAdmins);

    return { 
      users: supabaseUsers, 
      hierarchies: supabaseHierarchies, 
      permissions: supabasePermissions 
    };

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  }
}

// Run sync
syncToSupabase()
  .then((results) => {
    console.log('\n✨ Sync complete!');
    console.log('\n📋 Login credentials:');
    console.log('  Development Admin: admin@school.edu / 1234');
    console.log('  School Admin: sysadmin@cjcollegeprep.org / Admin123!@#');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  });
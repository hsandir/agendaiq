const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define role keys for the new system
const ROLE_KEYS = {
  'System Administrator': 'DEV_ADMIN',
  'Administrator': 'OPS_ADMIN',
  'Chief Education Officer': 'CHIEF_EDU_OFFICER',
  'Director of Operations': 'DIR_OPERATIONS',
  'Business Administrator': 'BUS_ADMIN',
  'Assistant Business Administrator': 'ASST_BUS_ADMIN',
  'Principal': 'PRINCIPAL',
  'Assistant Principal': 'ASST_PRINCIPAL',
  'Lead Teacher': 'LEAD_TEACHER',
  'Teacher': 'TEACHER',
  'Support Staff': 'SUPPORT_STAFF',
  'Administrative Assistant': 'ADMIN_ASSISTANT',
  'Substitute Teacher': 'SUBSTITUTE',
  'Special Education Teacher': 'SPED_TEACHER',
  'Counselor': 'COUNSELOR',
  'IT Support': 'IT_SUPPORT',
  'Custodian': 'CUSTODIAN',
  'Security': 'SECURITY',
  'Nurse': 'NURSE'
};

// Define capabilities for each role
const ROLE_CAPABILITIES = {
  'DEV_ADMIN': [
    'dev:ci', 'dev:git', 'dev:seed', 'dev:lint', 'dev:debug', 'dev:update', 'dev:fix', 'dev:mockdata',
    'ops:monitoring', 'ops:alerts', 'ops:backup', 'ops:logs', 'ops:health', 'ops:db:read', 'ops:db:write',
    'user:manage', 'role:manage', 'perm:manage', 'school:manage', 'staff:import',
    'meeting:create', 'meeting:view', 'meeting:edit', 'meeting:delete'
  ],
  'OPS_ADMIN': [
    'ops:monitoring', 'ops:alerts', 'ops:backup', 'ops:logs', 'ops:health', 'ops:db:read',
    'user:manage', 'role:manage', 'perm:manage', 'school:manage', 'staff:import',
    'meeting:create', 'meeting:view', 'meeting:edit', 'meeting:delete'
  ],
  'CHIEF_EDU_OFFICER': [
    'user:view', 'role:view', 'school:view', 'staff:view',
    'meeting:create', 'meeting:view', 'meeting:edit'
  ],
  'PRINCIPAL': [
    'staff:view', 'staff:manage',
    'meeting:create', 'meeting:view', 'meeting:edit'
  ],
  'TEACHER': [
    'meeting:create', 'meeting:view', 'meeting:edit:own'
  ],
  'SUPPORT_STAFF': [
    'meeting:view'
  ]
};

async function migrateRBACSystem() {
  try {
    console.log('🔄 Starting RBAC migration...\n');
    
    // Step 1: Update role keys
    console.log('📝 Updating role keys...');
    const roles = await prisma.role.findMany();
    
    for (const role of roles) {
      const key = ROLE_KEYS[role.title] || role.title.toUpperCase().replace(/\s+/g, '_');
      
      await prisma.role.update({
        where: { id: role.id },
        data: { key }
      });
      
      console.log(`  ✅ ${role.title} → ${key}`);
    }
    
    // Step 2: Update admin users
    console.log('\n👤 Updating admin users...');
    
    // Find current admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });
    
    if (adminUser) {
      const roleKey = adminUser.Staff?.Role?.key;
      
      if (roleKey === 'OPS_ADMIN' || adminUser.Staff?.Role?.title === 'Administrator') {
        // This is the school admin
        await prisma.user.update({
          where: { id: adminUser.id },
          data: {
            is_school_admin: true,
            is_system_admin: false
          }
        });
        console.log(`  ✅ ${adminUser.email} set as School Admin (OPS_ADMIN)`);
      }
    }
    
    // Set developer admin (you can change this email)
    const devAdminEmail = 'dev@agendaiq.com'; // Change this to your developer email
    let devAdmin = await prisma.user.findUnique({
      where: { email: devAdminEmail }
    });
    
    if (!devAdmin) {
      console.log(`  📝 Creating developer admin: ${devAdminEmail}`);
      devAdmin = await prisma.user.create({
        data: {
          email: devAdminEmail,
          name: 'System Developer',
          hashedPassword: '$2a$10$K7L1OJ0TfhOqOqJj2WQxzOVRjp5TgD8m5Rz0VdSQyBJqGYvWtQzXy', // password: dev1234
          is_system_admin: true,
          is_school_admin: false,
          emailVerified: new Date()
        }
      });
      
      // Find or create DEV_ADMIN role
      let devRole = await prisma.role.findFirst({
        where: { key: 'DEV_ADMIN' }
      });
      
      if (!devRole) {
        devRole = await prisma.role.create({
          data: {
            title: 'System Developer',
            key: 'DEV_ADMIN',
            priority: -1,
            level: -1,
            is_leadership: true,
            category: 'System'
          }
        });
      }
      
      // Create staff record for dev admin
      const districtOffice = await prisma.department.findFirst({
        where: { name: 'District Office' }
      });
      
      if (districtOffice) {
        await prisma.staff.create({
          data: {
            user_id: devAdmin.id,
            department_id: districtOffice.id,
            role_id: devRole.id,
            school_id: 2,
            district_id: 2,
            extension: '9999',
            room: '999',
            is_active: true,
            flags: ['active', 'system', 'developer']
          }
        });
      }
      
      console.log(`  ✅ Developer admin created: ${devAdminEmail}`);
    } else {
      await prisma.user.update({
        where: { id: devAdmin.id },
        data: {
          is_system_admin: true,
          is_school_admin: false
        }
      });
      console.log(`  ✅ ${devAdmin.email} set as System Admin (DEV_ADMIN)`);
    }
    
    // Step 3: Create permissions for roles
    console.log('\n🔑 Creating permissions...');
    
    for (const [roleKey, capabilities] of Object.entries(ROLE_CAPABILITIES)) {
      const role = await prisma.role.findFirst({
        where: { key: roleKey }
      });
      
      if (role) {
        // Delete existing permissions
        await prisma.permission.deleteMany({
          where: { role_id: role.id }
        });
        
        // Create new permissions
        for (const capability of capabilities) {
          const [resource, action] = capability.split(':');
          
          await prisma.permission.create({
            data: {
              role_id: role.id,
              capability,
              resource,
              action
            }
          });
        }
        
        console.log(`  ✅ ${roleKey}: ${capabilities.length} permissions created`);
      }
    }
    
    // Step 4: Update other users based on is_admin flag
    console.log('\n🔄 Migrating other admin flags...');
    const oldAdmins = await prisma.user.findMany({
      where: { is_admin: true }
    });
    
    for (const user of oldAdmins) {
      if (user.email !== adminUser?.email && user.email !== devAdminEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            is_school_admin: true // Default old admins to school admin
          }
        });
        console.log(`  ✅ ${user.email} migrated to school admin`);
      }
    }
    
    console.log('\n✅ RBAC migration completed successfully!');
    
    // Print summary
    const summary = await prisma.user.findMany({
      where: {
        OR: [
          { is_system_admin: true },
          { is_school_admin: true }
        ]
      },
      select: {
        email: true,
        is_system_admin: true,
        is_school_admin: true
      }
    });
    
    console.log('\n📊 Admin Summary:');
    summary.forEach(user => {
      const type = user.is_system_admin ? 'System Admin' : 'School Admin';
      console.log(`  - ${user.email}: ${type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateRBACSystem()
  .catch(console.error)
  .then(() => process.exit(0));
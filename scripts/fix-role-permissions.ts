import { prisma } from '../src/lib/prisma';
import { Capability } from '../src/lib/auth/policy';

async function fixRolePermissions() {
  try {
    console.log('Adding missing permissions to roles...\n');
    
    // Define permissions for each role
    const rolePermissions = {
      // Ops Admin - Operations capabilities
      'OPS_ADMIN': [
        Capability.OPS_MONITORING,
        Capability.OPS_LOGS,
        Capability.OPS_BACKUP,
        Capability.OPS_ALERTS,
        Capability.OPS_HEALTH,
        Capability.OPS_DB_READ,
        Capability.USER_MANAGE,
        Capability.ROLE_MANAGE,
        Capability.SCHOOL_MANAGE,
        Capability.MEETING_CREATE,
        Capability.MEETING_VIEW,
        Capability.MEETING_EDIT,
      ],
      
      // Dev Admin - All capabilities (handled by is_system_admin flag)
      'DEV_ADMIN': [
        // Dev admin gets all through is_system_admin flag
      ],
      
      // Chief Education Officer - Leadership capabilities
      'CHIEF_EDU_OFFICER': [
        Capability.OPS_MONITORING,
        Capability.OPS_LOGS,
        Capability.USER_MANAGE,
        Capability.ROLE_MANAGE,
        Capability.SCHOOL_MANAGE,
        Capability.MEETING_CREATE,
        Capability.MEETING_VIEW,
        Capability.MEETING_EDIT,
        Capability.STAFF_IMPORT,
      ],
      
      // Director of Operations
      'DIR_OPERATIONS': [
        Capability.OPS_MONITORING,
        Capability.OPS_LOGS,
        Capability.OPS_BACKUP,
        Capability.USER_MANAGE,
        Capability.SCHOOL_MANAGE,
        Capability.MEETING_CREATE,
        Capability.MEETING_VIEW,
        Capability.MEETING_EDIT,
      ],
      
      // Business Administrator
      'BUS_ADMIN': [
        Capability.USER_VIEW,
        Capability.MEETING_VIEW,
        Capability.MEETING_CREATE,
      ],
      
      // Assistant Business Administrator  
      'ASST_BUS_ADMIN': [
        Capability.USER_VIEW,
        Capability.MEETING_VIEW,
      ],
    };

    // Create permissions for each role
    for (const [roleKey, capabilities] of Object.entries(rolePermissions)) {
      const role = await prisma.role.findFirst({
        where: { key: roleKey }
      });
      
      if (!role) {
        console.log(`⚠️  Role ${roleKey} not found`);
        continue;
      }
      
      console.log(`Processing ${role.title} (${roleKey}):`);
      
      // Delete existing permissions
      await prisma.permission.deleteMany({
        where: { role_id: role.id }
      });
      
      // Create new permissions
      for (const capability of capabilities) {
        if (!capability) {
          console.log(`  ⚠️  Skipping undefined capability for ${roleKey}`);
          continue;
        }
        
        const parts = capability.split(':');
        await prisma.permission.create({
          data: {
            role_id: role.id,
            capability: capability,
            resource: parts.length > 1 ? parts[0] : capability.split('_')[0].toLowerCase(),
            action: parts.length > 1 ? parts.slice(1).join(':') : capability.split('_').slice(1).join('_').toLowerCase()
          }
        });
      }
      
      console.log(`  ✓ Added ${capabilities.length} permissions`);
    }
    
    // Also ensure all leadership roles have basic meeting permissions
    const leadershipRoles = await prisma.role.findMany({
      where: { is_leadership: true }
    });
    
    console.log('\nAdding basic permissions to all leadership roles:');
    for (const role of leadershipRoles) {
      // Check if role already has permissions
      const existingPermissions = await prisma.permission.count({
        where: { role_id: role.id }
      });
      
      if (existingPermissions === 0) {
        // Add basic meeting permissions
        const basicPermissions = [
          Capability.MEETING_VIEW,
          Capability.MEETING_CREATE,
          Capability.MEETING_EDIT_OWN,
        ];
        
        for (const capability of basicPermissions) {
          await prisma.permission.create({
            data: {
              role_id: role.id,
              capability: capability,
              resource: capability.split(':')[0],
              action: capability.split(':')[1] || 'access'
            }
          });
        }
        
        console.log(`  ✓ ${role.title}: Added ${basicPermissions.length} basic permissions`);
      } else {
        console.log(`  - ${role.title}: Already has ${existingPermissions} permissions`);
      }
    }
    
    console.log('\n✓ Role permissions fixed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRolePermissions();
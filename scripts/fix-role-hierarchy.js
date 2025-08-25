const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRoleHierarchy() {
  console.log('🔧 Fixing Role Hierarchy...\n');
  
  try {
    // Check existing hierarchies
    const existingHierarchies = await prisma.roleHierarchy.findMany({
      include: {
        ParentRole: true,
        ChildRole: true
      }
    });
    
    console.log(`Existing hierarchies: ${existingHierarchies.length}`);
    
    // Get all roles sorted by priority
    const roles = await prisma.role.findMany({
      orderBy: { priority: 'asc' }
    });
    
    console.log(`Total roles: ${roles.length}\n`);
    
    // Always rebuild for consistency
    console.log('Rebuilding role hierarchy...\n');
    await prisma.roleHierarchy.deleteMany({});
    
    // Create basic hierarchy
    const sysAdmin = roles.find(r => r.title === 'System Administrator');
    const ceo = roles.find(r => r.title === 'Chief Education Officer');
    
    if (sysAdmin && ceo) {
      await prisma.roleHierarchy.create({
        data: {
          parent_role_id: sysAdmin.id,
          child_role_id: ceo.id,
          hierarchy_level: 1
        }
      });
      console.log('✅ System Administrator → Chief Education Officer');
    }
    
    // CEO oversees all priority 2 roles
    const directors = roles.filter(r => r.priority === 2);
    for (const director of directors) {
      if (ceo && director.id !== ceo.id) {
        await prisma.roleHierarchy.create({
          data: {
            parent_role_id: ceo.id,
            child_role_id: director.id,
            hierarchy_level: 1
          }
        });
        console.log(`✅ Chief Education Officer → ${director.title}`);
      }
    }
    
    // Verify final state
    const finalHierarchies = await prisma.roleHierarchy.findMany({
      include: {
        ParentRole: true,
        ChildRole: true
      }
    });
    
    console.log(`\n📊 Total relationships created: ${finalHierarchies.length}`);
    console.log('✅ Role hierarchy fixed successfully\!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoleHierarchy().catch(console.error);

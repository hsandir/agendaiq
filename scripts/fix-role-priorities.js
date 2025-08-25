#!/usr/bin/env node

/**
 * Fix Role Priority Conflicts
 * Updates role priorities to ensure uniqueness without deleting any data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRolePriorities() {
  console.log('🔧 Fixing Role Priority Conflicts');
  console.log('=' .repeat(60));
  
  try {
    // Get all roles ordered by current priority and title
    const roles = await prisma.role.findMany({
      orderBy: [
        { priority: 'asc' },
        { title: 'asc' }
      ]
    });
    
    console.log(`Found ${roles.length} roles`);
    
    // Define the correct priority order based on hierarchy
    const priorityMap = {
      'DEV_ADMIN': 0,
      'OPS_ADMIN': 1,
      'System Administrator': 2,
      'Administrator': 3,
      'Superintendent': 4,
      'Principal': 5,
      'Vice Principal': 6,
      'Department Head': 7,
      'Teacher': 8,
      'Staff': 9,
      'Parent': 10,
      'Student': 11
    };
    
    // Update each role with correct priority
    for (const role of roles) {
      let newPriority;
      
      // Check if we have a predefined priority
      if (priorityMap[role.key] !== undefined) {
        newPriority = priorityMap[role.key];
      } else if (priorityMap[role.title] !== undefined) {
        newPriority = priorityMap[role.title];
      } else {
        // For unknown roles, assign a high priority number
        newPriority = 100 + role.id;
      }
      
      // Only update if priority changed
      if (role.priority !== newPriority) {
        await prisma.role.update({
          where: { id: role.id },
          data: { priority: newPriority }
        });
        console.log(`✅ Updated ${role.title} (${role.key}): ${role.priority} → ${newPriority}`);
      } else {
        console.log(`⏭️  ${role.title} (${role.key}): Already has priority ${newPriority}`);
      }
    }
    
    // Verify no conflicts remain
    const updatedRoles = await prisma.role.findMany({
      orderBy: { priority: 'asc' }
    });
    
    const priorityCheck = {};
    let hasConflicts = false;
    
    for (const role of updatedRoles) {
      if (priorityCheck[role.priority]) {
        console.log(`⚠️  Conflict remains: ${role.title} and ${priorityCheck[role.priority]} both have priority ${role.priority}`);
        hasConflicts = true;
      } else {
        priorityCheck[role.priority] = role.title;
      }
    }
    
    if (!hasConflicts) {
      console.log('\n✅ All role priority conflicts resolved!');
    } else {
      console.log('\n⚠️  Some conflicts remain. Manual intervention may be needed.');
    }
    
    // Display final role hierarchy
    console.log('\n📊 Final Role Hierarchy:');
    console.log('=' .repeat(60));
    for (const role of updatedRoles) {
      const leadership = role.is_leadership ? '👔' : '  ';
      console.log(`${leadership} ${role.priority.toString().padStart(3)}: ${role.title} (${role.key})`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing role priorities:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRolePriorities().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
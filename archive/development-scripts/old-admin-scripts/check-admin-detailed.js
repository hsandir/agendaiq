const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminDetailed() {
  try {
    console.log('🔍 Detailed admin user check...\n');
    
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@cjcp.edu' },
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true,
            District: true
          }
        }
      }
    });

    if (!adminUser) {
      console.log('❌ Admin user (admin@cjcp.edu) not found in User table');
      return;
    }

    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name || 'No name'}`);
    console.log(`   Staff ID: ${adminUser.staff_id || 'No staff_id'}`);
    console.log(`   Is Admin: ${adminUser.is_admin}`);
    console.log(`   Created: ${adminUser.created_at}`);
    console.log('');

    if (!adminUser.Staff || adminUser.Staff.length === 0) {
      console.log('❌ No staff records found for admin user');
      return;
    }

    console.log('📋 Staff records:');
    adminUser.Staff.forEach((staff, index) => {
      console.log(`   Staff ${index + 1}:`);
      console.log(`     ID: ${staff.id}`);
      console.log(`     Role: ${staff.Role?.title || 'No role'}`);
      console.log(`     Role Priority: ${staff.Role?.priority || 'No priority'}`);
      console.log(`     Is Leadership: ${staff.Role?.is_leadership || false}`);
      console.log(`     Department: ${staff.Department?.name || 'No department'}`);
      console.log(`     School: ${staff.School?.name || 'No school'}`);
      console.log(`     District: ${staff.District?.name || 'No district'}`);
      console.log('');
    });

    // Check if Administrator role exists
    const adminRole = await prisma.role.findUnique({
      where: { title: 'Administrator' }
    });

    if (!adminRole) {
      console.log('❌ Administrator role not found in Role table');
    } else {
      console.log('✅ Administrator role found:');
      console.log(`   ID: ${adminRole.id}`);
      console.log(`   Title: ${adminRole.title}`);
      console.log(`   Priority: ${adminRole.priority}`);
      console.log(`   Is Leadership: ${adminRole.is_leadership}`);
      console.log(`   Category: ${adminRole.category || 'No category'}`);
      console.log('');
    }

    // Check all roles with high priority
    const highPriorityRoles = await prisma.role.findMany({
      where: {
        priority: {
          lte: 5
        }
      },
      orderBy: {
        priority: 'asc'
      }
    });

    console.log('🏆 High priority roles (priority <= 5):');
    highPriorityRoles.forEach(role => {
      console.log(`   ${role.priority}. ${role.title} (Leadership: ${role.is_leadership})`);
    });

  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminDetailed(); 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listOrganizationData() {
  try {
    console.log('📊 Fetching all departments...');
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n✅ Found ${departments.length} departments:`);
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (Code: ${dept.code})`);
    });
    
    console.log('\n👥 Fetching all roles...');
    const roles = await prisma.role.findMany({
      include: {
        Department: true
      },
      orderBy: { title: 'asc' }
    });
    
    console.log(`\n✅ Found ${roles.length} roles:`);
    roles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.title} (Department: ${role.Department?.name || 'N/A'})`);
    });
    
    console.log('\n📋 Summary:');
    console.log(`📊 Total Departments: ${departments.length}`);
    console.log(`👥 Total Roles: ${roles.length}`);
    
  } catch (error) {
    console.error('❌ Error fetching organization data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listOrganizationData(); 
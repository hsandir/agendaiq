const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRoleDepartments() {
  try {
    console.log('🔧 Fixing role-department mappings...');
    
    // Get all departments for mapping
    const departments = await prisma.department.findMany();
    const deptMap = {};
    departments.forEach(dept => {
      deptMap[dept.code] = dept.id;
    });
    
    // Define correct role-department mappings
    const roleMappings = [
      { role: 'Speech-Language Pathologist', deptCode: 'SPEECH' },
      { role: 'Social Worker', deptCode: 'GUID' },
      { role: 'Art Teacher', deptCode: 'ARTS' },
      { role: 'Music Teacher', deptCode: 'ARTS' },
      { role: 'Library Assistant', deptCode: 'LIB' },
      { role: 'Academic Coach', deptCode: 'CURR' },
      { role: 'Testing Coordinator', deptCode: 'ASSESS' },
      { role: 'Safety Coordinator', deptCode: 'SEC' },
      { role: 'Assessment Coordinator', deptCode: 'ASSESS' },
      { role: 'Curriculum Coordinator', deptCode: 'CURR' },
      { role: 'Department Head', deptCode: 'COORD' },
      { role: 'Grade-Level Coordinator', deptCode: 'COORD' },
      { role: 'Instructional Coach', deptCode: 'CURR' },
      { role: 'Instructional Supervisor', deptCode: 'CURR' },
      { role: 'Intervention Specialist', deptCode: 'AIS' },
      { role: 'In-Class Support Teacher', deptCode: 'AIS' },
      { role: 'Behavior Interventionist', deptCode: 'GUID' },
      { role: 'Substitute Teacher', deptCode: 'ELEM' },
      { role: 'Substitute Teacher (Fulltime)', deptCode: 'ELEM' },
      { role: 'Long-term Substitute', deptCode: 'ELEM' },
      { role: 'Teaching Assistant', deptCode: 'ELEM' },
      { role: 'Summer School Teacher', deptCode: 'ELEM' },
      { role: 'Tutor', deptCode: 'ELEM' },
      { role: 'Volunteer Coordinator', deptCode: 'OFFICE' },
      { role: 'After-School Program Instructor', deptCode: 'ELEM' }
    ];
    
    let updatedCount = 0;
    
    for (const mapping of roleMappings) {
      try {
        const role = await prisma.role.findFirst({
          where: { title: mapping.role }
        });
        
        if (role && deptMap[mapping.deptCode]) {
          await prisma.role.update({
            where: { id: role.id },
            data: { department_id: deptMap[mapping.deptCode] }
          });
          
          const dept = departments.find(d => d.code === mapping.deptCode);
          console.log(`✅ Updated "${mapping.role}" → ${dept.name}`);
          updatedCount++;
        }
      } catch (error) {
        console.log(`❌ Error updating ${mapping.role}: ${error.message}`);
      }
    }
    
    console.log(`\n✨ Fixed ${updatedCount} role-department mappings!`);
    
  } catch (error) {
    console.error('❌ Error fixing role departments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoleDepartments(); 
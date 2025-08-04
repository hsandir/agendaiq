const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Fixing role hierarchy structure...\n');

    // Define hierarchy relationships
    const hierarchyMap = {
      // CEO's Office - Top Level
      'Chief Education Officer (CEO)': { parent: null, level: 1 },
      'Executive Assistant': { parent: 'Chief Education Officer (CEO)', level: 2 },
      'Strategic Planning Coordinator': { parent: 'Chief Education Officer (CEO)', level: 2 },
      'Board Relations Coordinator': { parent: 'Chief Education Officer (CEO)', level: 2 },
      'Policy Development Specialist': { parent: 'Chief Education Officer (CEO)', level: 2 },
      
      // Operations - Reports to CEO
      'Director of Operations': { parent: 'Chief Education Officer (CEO)', level: 2 },
      'Operations Coordinator': { parent: 'Director of Operations', level: 3 },
      'Facility Manager': { parent: 'Director of Operations', level: 3 },
      'Maintenance Supervisor': { parent: 'Facility Manager', level: 4 },
      'Transportation Coordinator': { parent: 'Director of Operations', level: 3 },
      'Food Service Manager': { parent: 'Director of Operations', level: 3 },
      
      // Business & Finance - Reports to CEO
      'Business Administrator': { parent: 'Chief Education Officer (CEO)', level: 2 },
      'Assistant Business Administrator': { parent: 'Business Administrator', level: 3 },
      'Budget Analyst': { parent: 'Business Administrator', level: 3 },
      'Financial Coordinator': { parent: 'Business Administrator', level: 3 },
      'Contract Manager': { parent: 'Business Administrator', level: 3 },
      'Compliance Officer': { parent: 'Business Administrator', level: 3 },
      'Business Operations Assistant': { parent: 'Assistant Business Administrator', level: 4 },
      'Financial Processing Coordinator': { parent: 'Assistant Business Administrator', level: 4 },
      
      // Curriculum Directors - Report to CEO
      'Director of Curriculum - Humanities': { parent: 'Chief Education Officer (CEO)', level: 2 },
      'Director of Curriculum - STEM': { parent: 'Chief Education Officer (CEO)', level: 2 },
      
      // Humanities Department
      'English Department Head': { parent: 'Director of Curriculum - Humanities', level: 3 },
      'English Teacher (Grades 9-12)': { parent: 'English Department Head', level: 4 },
      'English Teacher (Grades 6-8)': { parent: 'English Department Head', level: 4 },
      'English Teacher (Grades K-5)': { parent: 'English Department Head', level: 4 },
      
      'Social Studies Department Head': { parent: 'Director of Curriculum - Humanities', level: 3 },
      'Social Studies Teacher (Grades 9-12)': { parent: 'Social Studies Department Head', level: 4 },
      'Social Studies Teacher (Grades 6-8)': { parent: 'Social Studies Department Head', level: 4 },
      'Social Studies Teacher (Grades K-5)': { parent: 'Social Studies Department Head', level: 4 },
      'History Teacher': { parent: 'Social Studies Department Head', level: 4 },
      
      'Literature Teacher': { parent: 'Director of Curriculum - Humanities', level: 3 },
      'Writing Coordinator': { parent: 'Director of Curriculum - Humanities', level: 3 },
      'Reading Specialist': { parent: 'Director of Curriculum - Humanities', level: 3 },
      'ESL Coordinator': { parent: 'Director of Curriculum - Humanities', level: 3 },
      'World Languages Teacher': { parent: 'Director of Curriculum - Humanities', level: 3 },
      
      // STEM Department
      'Mathematics Department Head': { parent: 'Director of Curriculum - STEM', level: 3 },
      'Mathematics Teacher (High School)': { parent: 'Mathematics Department Head', level: 4 },
      'Mathematics Teacher (Middle School)': { parent: 'Mathematics Department Head', level: 4 },
      'Mathematics Teacher (Elementary)': { parent: 'Mathematics Department Head', level: 4 },
      'Algebra Teacher': { parent: 'Mathematics Department Head', level: 4 },
      'Geometry Teacher': { parent: 'Mathematics Department Head', level: 4 },
      'Calculus Teacher': { parent: 'Mathematics Department Head', level: 4 },
      'Statistics Teacher': { parent: 'Mathematics Department Head', level: 4 },
      
      'Science Department Head': { parent: 'Director of Curriculum - STEM', level: 3 },
      'Biology Teacher': { parent: 'Science Department Head', level: 4 },
      'Chemistry Teacher': { parent: 'Science Department Head', level: 4 },
      'Physics Teacher': { parent: 'Science Department Head', level: 4 },
      'Earth Science Teacher': { parent: 'Science Department Head', level: 4 },
      'Environmental Science Teacher': { parent: 'Science Department Head', level: 4 },
      
      'Computer Science Teacher': { parent: 'Director of Curriculum - STEM', level: 3 },
      'Engineering Teacher': { parent: 'Director of Curriculum - STEM', level: 3 },
      'Technology Integration Specialist': { parent: 'Director of Curriculum - STEM', level: 3 },
      'STEM Lab Coordinator': { parent: 'Director of Curriculum - STEM', level: 3 },
      
      // Supervisors - Report to CEO
      'Supervisors - Curriculum/Professional Development': { parent: 'Chief Education Officer (CEO)', level: 2 },
      'Curriculum Specialist': { parent: 'Supervisors - Curriculum/Professional Development', level: 3 },
      'Professional Development Coordinator': { parent: 'Supervisors - Curriculum/Professional Development', level: 3 },
      'Instructional Designer': { parent: 'Supervisors - Curriculum/Professional Development', level: 3 },
      'Assessment Development Specialist': { parent: 'Supervisors - Curriculum/Professional Development', level: 3 },
      'Training Coordinator': { parent: 'Supervisors - Curriculum/Professional Development', level: 3 },
      'Mentoring Program Coordinator': { parent: 'Supervisors - Curriculum/Professional Development', level: 3 },
      
      // Accountability - Reports to CEO
      'Director of Accountability': { parent: 'Chief Education Officer (CEO)', level: 2 },
      'Data Analyst': { parent: 'Director of Accountability', level: 3 },
      'Assessment Coordinator': { parent: 'Director of Accountability', level: 3 },
      'Testing Coordinator': { parent: 'Director of Accountability', level: 3 },
      'Quality Assurance Specialist': { parent: 'Director of Accountability', level: 3 },
      'Performance Evaluation Specialist': { parent: 'Director of Accountability', level: 3 },
      'Standards Compliance Officer': { parent: 'Director of Accountability', level: 3 },
    };

    // Get all roles
    const allRoles = await prisma.role.findMany();
    const rolesByTitle = new Map(allRoles.map(r => [r.title, r]));

    // Update each role with its parent
    for (const [title, config] of Object.entries(hierarchyMap)) {
      const role = rolesByTitle.get(title);
      if (!role) {
        console.log(`⚠️  Role not found: ${title}`);
        continue;
      }

      let parentId = null;
      if (config.parent) {
        const parentRole = rolesByTitle.get(config.parent);
        if (parentRole) {
          parentId = parentRole.id;
        } else {
          console.log(`⚠️  Parent role not found for ${title}: ${config.parent}`);
        }
      }

      // Update role
      await prisma.role.update({
        where: { id: role.id },
        data: {
          parent_id: parentId,
          level: config.level
        }
      });

      console.log(`✅ Updated ${title} - Parent: ${config.parent || 'None'}, Level: ${config.level}`);
    }

    // Set categories for roles
    const categoryMap = {
      'ADMIN': ['Chief Education Officer (CEO)', 'Business Administrator', 'Director of Operations', 'Director of Accountability'],
      'LEADERSHIP': ['Director of Curriculum - Humanities', 'Director of Curriculum - STEM', 'Supervisors - Curriculum/Professional Development'],
      'DEPARTMENT_HEAD': ['English Department Head', 'Social Studies Department Head', 'Mathematics Department Head', 'Science Department Head'],
      'TEACHER': ['English Teacher', 'Mathematics Teacher', 'Science Teacher', 'Biology Teacher', 'Chemistry Teacher', 'Physics Teacher'],
      'STAFF': ['Executive Assistant', 'Operations Coordinator', 'Data Analyst', 'Budget Analyst'],
      'SUPPORT': ['Facility Manager', 'Maintenance Supervisor', 'Transportation Coordinator', 'Food Service Manager']
    };

    for (const [category, titles] of Object.entries(categoryMap)) {
      for (const title of titles) {
        // Update all roles that contain this title
        await prisma.role.updateMany({
          where: {
            title: {
              contains: title
            }
          },
          data: {
            category: category
          }
        });
      }
    }

    console.log('\n✅ Role hierarchy structure has been fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing role hierarchy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
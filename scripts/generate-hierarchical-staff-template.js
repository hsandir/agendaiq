const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Sample names for different roles
const executiveNames = [
  'Dr. Robert Johnson', 'Dr. Sarah Williams', 'Dr. Michael Davis', 'Dr. Jennifer Brown'
];

const directorNames = [
  'Maria Rodriguez', 'James Wilson', 'Lisa Anderson', 'David Thompson', 'Susan Miller',
  'Christopher Garcia', 'Patricia Martinez', 'Daniel Jones', 'Nancy Taylor', 'Kevin White'
];

const chairNames = [
  'Dr. Emily Chen', 'Dr. Marcus Johnson', 'Dr. Rachel Green', 'Dr. Thomas Lee',
  'Dr. Amanda Clark', 'Dr. Jonathan Smith', 'Dr. Michelle Parker'
];

const departmentHeadNames = [
  'Helen Rodriguez', 'Mark Stevens', 'Carol Williams', 'Robert Davis',
  'Linda Thompson', 'Paul Martinez', 'Sandra Johnson', 'Michael Brown'
];

const teacherNames = [
  'Jennifer Adams', 'Matthew Baker', 'Sarah Campbell', 'David Clark', 'Lisa Davis',
  'John Edwards', 'Mary Flores', 'Christopher Garcia', 'Amanda Harris', 'Joshua Jackson',
  'Jessica Johnson', 'Michael Jones', 'Ashley King', 'Daniel Lee', 'Michelle Lewis',
  'Ryan Martinez', 'Nicole Miller', 'Anthony Moore', 'Stephanie Nelson', 'Kevin Parker',
  'Rachel Phillips', 'Brandon Roberts', 'Samantha Rodriguez', 'Timothy Smith', 'Vanessa Taylor',
  'Jacob Thomas', 'Brittany Turner', 'Nathan Walker', 'Heather White', 'Tyler Williams',
  'Courtney Wilson', 'Aaron Wright', 'Megan Young', 'Justin Allen', 'Tiffany Anderson',
  'Jonathan Baker', 'Danielle Brown', 'Steven Campbell', 'Melissa Carter', 'Eric Clark',
  'Kimberly Collins', 'Gregory Davis', 'Christina Edwards', 'Patrick Evans', 'Alicia Flores',
  'Benjamin Garcia', 'Jasmine Green', 'Nicholas Hall', 'Alexis Harris', 'Jordan Hill',
  'Destiny Jackson', 'Cameron Johnson', 'Brianna Jones', 'Zachary King', 'Gabrielle Lee',
  'Mason Lewis', 'Natalie Martinez', 'Ethan Miller', 'Olivia Moore', 'Caleb Nelson',
  'Sophia Parker', 'Isaiah Phillips', 'Emma Roberts', 'Elijah Rodriguez', 'Ava Smith',
  'Logan Taylor', 'Mia Thomas', 'Lucas Turner', 'Chloe Walker', 'Mason White',
  'Abigail Williams', 'Alexander Wilson', 'Emily Wright', 'William Young', 'Madison Allen'
];

async function generateHierarchicalTemplate() {
  try {
    console.log('🚀 Generating hierarchical staff template...');
    
    const roles = await prisma.role.findMany({
      include: { Department: true },
      orderBy: [
        { level: 'asc' },
        { priority: 'asc' }
      ]
    });

    const departments = await prisma.department.findMany();

    const staffRecords = [];
    let staffIdCounter = 1;
    let nameIndex = 0;

    // Helper function to get next staff ID
    const getNextStaffId = () => `STAFF${String(staffIdCounter++).padStart(4, '0')}`;

    // Helper function to get email from name
    const getEmail = (name) => {
      return name.toLowerCase()
        .replace(/dr\.\s*/g, '')
        .replace(/\s+/g, '.')
        .replace(/[^a-z.]/g, '') + '@agendaiq.edu';
    };

    // Level 0: Top executives (1 each)
    const level0Roles = roles.filter(r => r.level === 0);
    level0Roles.forEach((role, index) => {
      const name = executiveNames[index % executiveNames.length];
      staffRecords.push({
        Email: getEmail(name),
        Name: name,
        StaffId: getNextStaffId(),
        Role: role.title,
        Department: role.Department?.name || 'Administration'
      });
    });

    // Level 1: Assistant Superintendents (1 each)
    const level1Roles = roles.filter(r => r.level === 1);
    level1Roles.forEach((role, index) => {
      const name = directorNames[index % directorNames.length];
      staffRecords.push({
        Email: getEmail(name),
        Name: name,
        StaffId: getNextStaffId(),
        Role: role.title,
        Department: role.Department?.name || 'Administration'
      });
    });

    // Level 2: Directors (1 each)
    const level2Roles = roles.filter(r => r.level === 2);
    level2Roles.forEach((role, index) => {
      const name = directorNames[(index + 3) % directorNames.length];
      staffRecords.push({
        Email: getEmail(name),
        Name: name,
        StaffId: getNextStaffId(),
        Role: role.title,
        Department: role.Department?.name || 'Operations'
      });
    });

    // Level 3: Chairs (1 each)
    const level3Roles = roles.filter(r => r.level === 3);
    level3Roles.forEach((role, index) => {
      const name = chairNames[index % chairNames.length];
      staffRecords.push({
        Email: getEmail(name),
        Name: name,
        StaffId: getNextStaffId(),
        Role: role.title,
        Department: role.Department?.name || 'Instruction'
      });
    });

    // Level 4: Department Heads (1 each)
    const level4Roles = roles.filter(r => r.level === 4);
    level4Roles.forEach((role, index) => {
      const name = departmentHeadNames[index % departmentHeadNames.length];
      staffRecords.push({
        Email: getEmail(name),
        Name: name,
        StaffId: getNextStaffId(),
        Role: role.title,
        Department: role.Department?.name || 'Academic'
      });
    });

    // Level 5: Teachers (multiple for each role)
    const level5Roles = roles.filter(r => r.level === 5);
    level5Roles.forEach((role) => {
      // For teacher roles, create 2-4 people each
      const teacherCount = role.title.includes('Mathematics') ? 4 : 
                          role.title.includes('Science') ? 3 : 
                          role.title.includes('English') ? 4 : 2;
      
      for (let i = 0; i < teacherCount; i++) {
        const name = teacherNames[nameIndex % teacherNames.length];
        nameIndex++;
        
        staffRecords.push({
          Email: getEmail(name),
          Name: name,
          StaffId: getNextStaffId(),
          Role: role.title,
          Department: role.Department?.name || 'Education'
        });
      }
    });

    // Add some cross-role assignments (same person with multiple roles)
    // Mathematics teachers who also teach 6th grade
    const mathTeachers = staffRecords.filter(r => r.Role === 'Mathematics Teacher');
    if (mathTeachers.length > 0) {
      const crossRoleTeacher = mathTeachers[0];
      staffRecords.push({
        Email: crossRoleTeacher.Email,
        Name: crossRoleTeacher.Name,
        StaffId: getNextStaffId(),
        Role: 'Grade-Level Supervisor',
        Department: 'Instruction'
      });
    }

    // Science teacher who also does STEM integration
    const scienceTeachers = staffRecords.filter(r => r.Role === 'Science Teacher');
    if (scienceTeachers.length > 0) {
      const crossRoleTeacher = scienceTeachers[0];
      staffRecords.push({
        Email: crossRoleTeacher.Email,
        Name: crossRoleTeacher.Name,
        StaffId: getNextStaffId(),
        Role: 'STEM Integration Teacher',
        Department: 'STEM/Technology Department'
      });
    }

    // Fill remaining slots to reach 100 people
    while (staffRecords.length < 100) {
      const randomRole = level5Roles[Math.floor(Math.random() * level5Roles.length)];
      const name = teacherNames[nameIndex % teacherNames.length];
      nameIndex++;
      
      staffRecords.push({
        Email: getEmail(name),
        Name: name,
        StaffId: getNextStaffId(),
        Role: randomRole.title,
        Department: randomRole.Department?.name || 'Education'
      });
    }

    // Generate CSV content
    const csvContent = [
      'Email,Name,StaffId,Role,Department',
      ...staffRecords.map(record => 
        `${record.Email},${record.Name},${record.StaffId},${record.Role},${record.Department}`
      )
    ].join('\n');

    // Write to file
    fs.writeFileSync('public/templates/staff-upload-template.csv', csvContent);

    console.log(`✅ Generated hierarchical staff template with ${staffRecords.length} records`);
    console.log('\n📊 Role Distribution:');
    
    // Count by level
    const levelCounts = {};
    for (const record of staffRecords) {
      const role = roles.find(r => r.title === record.Role);
      const level = role?.level || 'Unknown';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    }
    
    Object.entries(levelCounts).forEach(([level, count]) => {
      console.log(`Level ${level}: ${count} people`);
    });

    console.log('\n🎯 Cross-role assignments included for realistic hierarchy');
    console.log('📁 Template saved to: public/templates/staff-upload-template.csv');

  } catch (error) {
    console.error('❌ Error generating template:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateHierarchicalTemplate(); 
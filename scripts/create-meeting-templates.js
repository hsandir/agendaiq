const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMeetingTemplates() {
  try {
    console.log('Creating default meeting templates...\n');
    
    // Get admin staff member to be the creator
    const adminStaff = await prisma.staff.findFirst({
      where: {
        User: {
          email: 'admin@cjcp.edu'
        }
      }
    });

    if (!adminStaff) {
      console.error('Admin staff not found. Please run setup-cjcp-hierarchy.js first.');
      return;
    }

    const templates = [
      {
        name: 'Department Meeting',
        description: 'Regular department staff meeting for updates and planning',
        duration: 60,
        agenda: '1. Department updates\n2. Staff announcements\n3. Planning for upcoming events\n4. Open discussion',
        attendees: ['Department Head', 'Teacher'],
        is_active: true
      },
      {
        name: 'Leadership Council',
        description: 'Meeting for school leadership team',
        duration: 90,
        agenda: '1. School-wide initiatives\n2. Policy updates\n3. Strategic planning\n4. Administrative matters',
        attendees: ['Administrator', 'Principal', 'Vice Principal', 'Department Head'],
        is_active: true
      },
      {
        name: 'Parent-Teacher Conference',
        description: 'Individual parent-teacher conference',
        duration: 30,
        agenda: '1. Student progress review\n2. Academic performance discussion\n3. Behavioral observations\n4. Recommendations and next steps',
        attendees: ['Teacher', 'Department Head'],
        is_active: true
      },
      {
        name: 'Staff Professional Development',
        description: 'Professional development session for staff',
        duration: 120,
        agenda: '1. Training topic introduction\n2. Interactive session\n3. Group activities\n4. Q&A and discussion',
        attendees: ['Teacher', 'Department Head', 'Supervisor'],
        is_active: true
      },
      {
        name: 'Student Support Team Meeting',
        description: 'Meeting to discuss student support and intervention strategies',
        duration: 45,
        agenda: '1. Student case review\n2. Support strategies discussion\n3. Resource allocation\n4. Follow-up planning',
        attendees: ['Academic Counselor', 'Social Worker', 'School Psychologist', 'Department Head'],
        is_active: true
      },
      {
        name: 'Curriculum Planning Session',
        description: 'Curriculum development and planning meeting',
        duration: 75,
        agenda: '1. Curriculum review\n2. Standards alignment\n3. Assessment planning\n4. Resource needs',
        attendees: ['Director of Curriculum', 'Department Head', 'Teacher'],
        is_active: true
      },
      {
        name: 'Emergency Response Team',
        description: 'Emergency preparedness and response planning',
        duration: 60,
        agenda: '1. Emergency procedures review\n2. Response team coordination\n3. Communication protocols\n4. Training needs',
        attendees: ['Administrator', 'Head of Security', 'School Nurse', 'Department Head'],
        is_active: true
      }
    ];

    for (const template of templates) {
      const createdTemplate = await prisma.meetingTemplate.create({
        data: {
          ...template,
          created_by: adminStaff.id
        }
      });
      console.log(`✅ Created template: ${createdTemplate.name}`);
    }

    console.log('\n🎉 Default meeting templates created successfully!');
    
    // Display summary
    const templateCount = await prisma.meetingTemplate.count();
    console.log(`\n📊 Total templates in database: ${templateCount}`);
    
  } catch (error) {
    console.error('Error creating meeting templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMeetingTemplates(); 
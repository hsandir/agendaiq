/**
 * Create sample teams in v2 database
 */

const { PrismaClient: PrismaClientV2 } = require('@prisma/client-v2');
const prismaV2 = new PrismaClientV2();

async function createSampleTeams() {
  try {
    console.log('🚀 Creating sample teams...');

    // Get first school
    const school = await prismaV2.school.findFirst();
    if (!school) {
      console.error('❌ No school found. Please copy data first.');
      return;
    }

    // Get some users
    const users = await prismaV2.user.findMany({
      take: 10
    });

    if (users.length < 3) {
      console.error('❌ Not enough users found. Please copy data first.');
      return;
    }

    // Sample teams data
    const teams = [
      {
        name: 'Pi Day Committee 2025',
        code: 'EVENT_PI_DAY_2025',
        type: 'EVENT',
        purpose: 'Organize and coordinate the annual Pi Day celebration including activities, competitions, and educational workshops for students.',
        school_id: school.id,
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-03-15'),
        created_by: users[0].id,
        status: 'ACTIVE'
      },
      {
        name: 'Technology Integration Team',
        code: 'PROJECT_TECH_INTEGRATION',
        type: 'PROJECT',
        purpose: 'Implement new educational technology tools and train teachers on effective integration methods.',
        school_id: school.id,
        start_date: new Date('2024-09-01'),
        end_date: new Date('2025-06-30'),
        created_by: users[1].id,
        status: 'ACTIVE'
      },
      {
        name: 'Curriculum Review Committee',
        code: 'COMMITTEE_CURRICULUM_2024',
        type: 'COMMITTEE',
        purpose: 'Review and update curriculum standards, ensuring alignment with educational goals and student needs.',
        school_id: school.id,
        start_date: new Date('2024-08-01'),
        end_date: null, // Ongoing committee
        created_by: users[2].id,
        status: 'ACTIVE'
      },
      {
        name: 'Science Fair 2024',
        code: 'EVENT_SCIENCE_FAIR_2024',
        type: 'EVENT',
        purpose: 'Organized the annual science fair. Event completed successfully with 150+ student projects.',
        school_id: school.id,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-05-30'),
        created_by: users[0].id,
        status: 'ARCHIVED' // Completed event
      }
    ];

    // Create teams
    for (const teamData of teams) {
      console.log(`📝 Creating team: ${teamData.name}`);
      
      const team = await prismaV2.team.create({
        data: {
          ...teamData,
          members: {
            create: {
              user_id: teamData.created_by,
              role: 'LEAD'
            }
          }
        }
      });

      // Add additional members
      const memberCount = Math.floor(Math.random() * 4) + 2; // 2-5 additional members
      const addedUsers = new Set([teamData.created_by]);
      
      for (let i = 0; i < memberCount && i < users.length; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        if (!addedUsers.has(randomUser.id)) {
          await prismaV2.teamMember.create({
            data: {
              team_id: team.id,
              user_id: randomUser.id,
              role: 'MEMBER'
            }
          });
          addedUsers.add(randomUser.id);
          console.log(`  👤 Added member: ${randomUser.name || randomUser.email}`);
        }
      }

      // Add some sample notes
      const notes = [
        {
          title: 'Initial Planning Meeting',
          content: 'Discussed project goals, timeline, and resource allocation. All team members present.',
          category: 'MEETING_NOTE'
        },
        {
          title: 'Budget Approval',
          content: 'Budget of $5000 approved by administration for event expenses.',
          category: 'DECISION'
        },
        {
          title: 'Vendor Selection',
          content: 'For future events, establish vendor relationships early in the planning process.',
          category: 'LESSON'
        }
      ];

      // Add 1-2 random notes per team
      const noteCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < noteCount && i < notes.length; i++) {
        await prismaV2.teamNote.create({
          data: {
            team_id: team.id,
            ...notes[i],
            created_by: teamData.created_by
          }
        });
        console.log(`  📝 Added note: ${notes[i].title}`);
      }
    }

    // Get final stats
    const teamCount = await prismaV2.team.count();
    const memberCount = await prismaV2.teamMember.count();
    const noteCount = await prismaV2.teamNote.count();

    console.log('\n✅ Sample teams created successfully!');
    console.log('\n📊 Database Stats:');
    console.log(`- Total Teams: ${teamCount}`);
    console.log(`- Total Members: ${memberCount}`);
    console.log(`- Total Notes: ${noteCount}`);

  } catch (error) {
    console.error('❌ Error creating sample teams:', error);
  } finally {
    await prismaV2.$disconnect();
  }
}

// Run the script
createSampleTeams();
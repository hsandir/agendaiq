import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// Generate CUID-like ID
function generateCUID(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(12).toString('hex');
  return `c${timestamp}${random}`.substring(0, 25);
}

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Teams test data seeding...');

  try {
    // Get existing users
    const users = await prisma.users.findMany({
      include: { staff: true },
      take: 10
    });

    if (users.length === 0) {
      console.log('No users found in database. Creating test users...');
      
      // Create test users
      const testUsers = [];
      for (let i = 1; i <= 5; i++) {
        const hashedPassword = await bcrypt.hash('Test123!', 10);
        const user = await prisma.users.create({
          data: {
            email: `test.user${i}@school.edu`,
            name: `Test User ${i}`,
            hashed_password: hashedPassword,
            email_verified: new Date(),
            updated_at: new Date()
          }
        });
        testUsers.push(user);
      }
      
      // Create staff records for test users
      const school = await prisma.school.findFirst();
      const district = await prisma.district.findFirst();
      const role = await prisma.role.findFirst();
      const department = await prisma.department.findFirst();
      
      if (!school || !district || !role || !department) {
        console.error('Missing required organization data');
        return;
      }
      
      for (const user of testUsers) {
        await prisma.staff.create({
          data: {
            user_id: user.id,
            school_id: school.id,
            district_id: district.id,
            role_id: role.id,
            department_id: department.id,
            is_active: true
          }
        });
      }
      
      // Refresh users list
      const refreshedUsers = await prisma.users.findMany({
        include: { staff: true },
        take: 10
      });
      users.push(...refreshedUsers);
    }

    console.log(`Found ${users.length} users to work with`);

    // Create teams with different types
    const teamTypes = ['DEPARTMENT', 'PROJECT', 'COMMITTEE', 'SUBJECT', 'GRADE_LEVEL'];
    const teams = [];

    // Get the first staff to use as creator
    const firstStaff = await prisma.staff.findFirst();
    if (!firstStaff) {
      console.error('No staff found to create teams');
      return;
    }

    for (let i = 0; i < teamTypes.length; i++) {
      const team = await prisma.teams.create({
        data: {
          id: generateCUID(),
          name: `${teamTypes[i].replace('_', ' ')} Team ${i + 1}`,
          code: `TEAM_${teamTypes[i]}_${i + 1}`,
          type: teamTypes[i],
          status: 'ACTIVE',
          purpose: `Manage ${teamTypes[i].toLowerCase().replace('_', ' ')} activities and improve collaboration`,
          start_date: new Date(),
          is_recurring: false,
          school_id: firstStaff.school_id,
          department_id: firstStaff.department_id,
          district_id: firstStaff.district_id,
          created_by: firstStaff.id,
          updated_at: new Date()
        }
      });
      teams.push(team);
      console.log(`✅ Created team: ${team.name}`);
    }

    // Add members to teams
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      const availableUsers = users.filter(u => u.staff.length > 0);
      
      if (availableUsers.length === 0) {
        console.log('No users with staff records available');
        continue;
      }
      
      // Add team lead
      const leadUser = availableUsers[i % availableUsers.length];
      if (leadUser.staff[0]) {
        await prisma.team_members.create({
          data: {
            id: generateCUID(),
            team_id: team.id,
            user_id: leadUser.id,
            staff_id: leadUser.staff[0].id,
            role: 'LEAD',
            joined_at: new Date()
          }
        });
        console.log(`  - Added ${leadUser.name} as team lead`);
      }
      
      // Add 2-4 regular members
      const memberCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < memberCount && j < availableUsers.length - 1; j++) {
        const memberUser = availableUsers[(i + j + 1) % availableUsers.length];
        if (memberUser.staff[0] && memberUser.id !== leadUser.id) {
          const existingMember = await prisma.team_members.findFirst({
            where: {
              team_id: team.id,
              staff_id: memberUser.staff[0].id
            }
          });
          
          if (!existingMember) {
            await prisma.team_members.create({
              data: {
                id: generateCUID(),
                team_id: team.id,
                user_id: memberUser.id,
                staff_id: memberUser.staff[0].id,
                role: 'MEMBER',
                joined_at: new Date()
              }
            });
            console.log(`  - Added ${memberUser.name} as member`);
          }
        }
      }
    }

    // Create knowledge resources for each team
    const resourceTypes = ['DOCUMENT', 'LINK', 'NOTE', 'PRESENTATION', 'SPREADSHEET'];
    const categories = ['Meeting Notes', 'Policies & Procedures', 'Training Materials', 'Project Documents', 'Templates'];
    
    for (const team of teams) {
      console.log(`\n📚 Creating knowledge resources for ${team.name}...`);
      
      // Get team members to assign as creators
      const teamMembers = await prisma.team_members.findMany({
        where: { team_id: team.id }
      });
      
      if (teamMembers.length === 0) {
        console.log('No team members found');
        continue;
      }
      
      // Create 3-5 knowledge resources per team
      const resourceCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < resourceCount; i++) {
        const resourceType = resourceTypes[i % resourceTypes.length];
        const category = categories[i % categories.length];
        const creator = teamMembers[i % teamMembers.length];
        
        let url = null;
        let content = null;
        
        if (resourceType === 'LINK') {
          url = `https://example.com/resource-${i + 1}`;
        } else if (resourceType === 'NOTE') {
          content = `# Sample Note ${i + 1}\n\nThis is a sample note with **markdown** content.\n\n## Key Points\n- Point 1\n- Point 2\n- Point 3`;
        } else {
          url = `/uploads/sample-${resourceType.toLowerCase()}-${i + 1}.pdf`;
        }
        
        const knowledge = await prisma.team_knowledge.create({
          data: {
            id: generateCUID(),
            team_id: team.id,
            title: `${category} - ${resourceType} ${i + 1}`,
            content: content || `Sample content for ${resourceType.toLowerCase()}`,
            type: resourceType,
            category: 'NOTE',
            visibility: i % 2 === 0 ? 'PUBLIC' : 'TEAM',
            url: url,
            tags: [`tag${i + 1}`, category.toLowerCase().replace(' ', '-'), resourceType.toLowerCase()],
            is_pinned: i === 0,
            created_by: creator.user_id,
            updated_at: new Date(),
            metadata: {
              author: 'Test Author',
              version: '1.0',
              lastReviewed: new Date().toISOString().split('T')[0],
              department: team.type === 'DEPARTMENT' ? team.name : null,
              confidentiality: i % 3 === 0 ? 'confidential' : 'internal'
            }
          }
        });
        
        console.log(`  ✅ Created ${resourceType}: ${knowledge.title}`);
      }
    }

    // Create some team activities (optional - for activity tracking)
    console.log('\n📊 Summary:');
    const totalTeams = await prisma.teams.count();
    const totalMembers = await prisma.team_members.count();
    const totalKnowledge = await prisma.team_knowledge.count();
    
    console.log(`  - Total teams: ${totalTeams}`);
    console.log(`  - Total team members: ${totalMembers}`);
    console.log(`  - Total knowledge resources: ${totalKnowledge}`);
    
    console.log('\n✨ Teams test data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
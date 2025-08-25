import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { generateCUID } from '@/lib/utils/cuid';

describe('Teams Integration Tests', () => {
  let testUser: any;
  let testStaff: any;
  let testTeam: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test user and staff
    testUser = await prisma.users.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashed_password',
        emailVerified: new Date()
      }
    });

    testStaff = await prisma.staff.create({
      data: {
        user_id: testUser.id,
        first_name: 'Test',
        last_name: 'User',
        email: testUser.email
      }
    });

    // Simulate authentication token
    authToken = `test-token-${testUser.id}`;
  });

  afterAll(async () => {
    // Clean up test data
    if (testTeam) {
      await prisma.team_knowledge.deleteMany({
        where: { team_id: testTeam.id }
      });
      await prisma.team_members.deleteMany({
        where: { team_id: testTeam.id }
      });
      await prisma.teams.delete({
        where: { id: testTeam.id }
      });
    }

    await prisma.staff.delete({
      where: { id: testStaff.id }
    });

    await prisma.users.delete({
      where: { id: testUser.id }
    });
  });

  describe('Team Creation Flow', () => {
    it('should create a team with proper structure', async () => {
      const teamId = generateCUID();
      
      testTeam = await prisma.teams.create({
        data: {
          id: teamId,
          name: 'Integration Test Team',
          code: `INT_TEST_${Date.now()}`,
          type: 'PROJECT',
          status: 'ACTIVE',
          purpose: 'Integration testing',
          description: 'Team for integration tests',
          is_active: true,
          metadata: {
            test: true,
            created_by: 'integration_test'
          },
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      expect(testTeam).toBeDefined();
      expect(testTeam.id).toBe(teamId);
      expect(testTeam.name).toBe('Integration Test Team');
      expect(testTeam.type).toBe('PROJECT');
      expect(testTeam.is_active).toBe(true);
    });

    it('should add creator as team leader', async () => {
      const member = await prisma.team_members.create({
        data: {
          team_id: testTeam.id,
          user_id: testUser.id,
          staff_id: testStaff.id,
          role: 'LEADER',
          joined_at: new Date()
        }
      });

      expect(member).toBeDefined();
      expect(member.role).toBe('LEADER');
      expect(member.user_id).toBe(testUser.id);
    });
  });

  describe('Team Members Management', () => {
    let secondUser: any;
    let secondStaff: any;

    beforeEach(async () => {
      // Create second test user
      secondUser = await prisma.users.create({
        data: {
          email: `second-${Date.now()}@example.com`,
          name: 'Second User',
          password: 'hashed_password',
          emailVerified: new Date()
        }
      });

      secondStaff = await prisma.staff.create({
        data: {
          user_id: secondUser.id,
          first_name: 'Second',
          last_name: 'User',
          email: secondUser.email
        }
      });
    });

    afterAll(async () => {
      if (secondStaff) {
        await prisma.team_members.deleteMany({
          where: { staff_id: secondStaff.id }
        });
        await prisma.staff.delete({
          where: { id: secondStaff.id }
        });
      }
      if (secondUser) {
        await prisma.users.delete({
          where: { id: secondUser.id }
        });
      }
    });

    it('should add new team member', async () => {
      const newMember = await prisma.team_members.create({
        data: {
          team_id: testTeam.id,
          user_id: secondUser.id,
          staff_id: secondStaff.id,
          role: 'MEMBER',
          joined_at: new Date()
        }
      });

      expect(newMember).toBeDefined();
      expect(newMember.role).toBe('MEMBER');
    });

    it('should list all team members', async () => {
      const members = await prisma.team_members.findMany({
        where: { team_id: testTeam.id },
        include: {
          user: true,
          staff: true
        }
      });

      expect(members).toHaveLength(2);
      expect(members.some(m => m.role === 'LEADER')).toBe(true);
      expect(members.some(m => m.role === 'MEMBER')).toBe(true);
    });

    it('should update member role', async () => {
      const updated = await prisma.team_members.updateMany({
        where: {
          team_id: testTeam.id,
          user_id: secondUser.id
        },
        data: {
          role: 'ADMIN'
        }
      });

      expect(updated.count).toBe(1);

      const member = await prisma.team_members.findFirst({
        where: {
          team_id: testTeam.id,
          user_id: secondUser.id
        }
      });

      expect(member?.role).toBe('ADMIN');
    });

    it('should remove team member', async () => {
      const deleted = await prisma.team_members.deleteMany({
        where: {
          team_id: testTeam.id,
          user_id: secondUser.id
        }
      });

      expect(deleted.count).toBe(1);

      const members = await prisma.team_members.findMany({
        where: { team_id: testTeam.id }
      });

      expect(members).toHaveLength(1);
    });
  });

  describe('Team Knowledge Management', () => {
    let knowledgeItem: any;

    it('should create knowledge resource', async () => {
      knowledgeItem = await prisma.team_knowledge.create({
        data: {
          team_id: testTeam.id,
          title: 'Test Documentation',
          type: 'DOCUMENT',
          url: 'https://example.com/test-doc',
          description: 'Test documentation for the team',
          is_public: false,
          views_count: 0,
          downloads_count: 0,
          created_by_staff_id: testStaff.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      expect(knowledgeItem).toBeDefined();
      expect(knowledgeItem.title).toBe('Test Documentation');
      expect(knowledgeItem.type).toBe('DOCUMENT');
    });

    it('should list team knowledge resources', async () => {
      const knowledge = await prisma.team_knowledge.findMany({
        where: { team_id: testTeam.id }
      });

      expect(knowledge).toHaveLength(1);
      expect(knowledge[0].title).toBe('Test Documentation');
    });

    it('should update knowledge resource', async () => {
      const updated = await prisma.team_knowledge.update({
        where: { id: knowledgeItem.id },
        data: {
          title: 'Updated Documentation',
          views_count: { increment: 1 }
        }
      });

      expect(updated.title).toBe('Updated Documentation');
      expect(updated.views_count).toBe(1);
    });

    it('should track knowledge metrics', async () => {
      // Increment view count
      await prisma.team_knowledge.update({
        where: { id: knowledgeItem.id },
        data: {
          views_count: { increment: 5 },
          downloads_count: { increment: 2 }
        }
      });

      const knowledge = await prisma.team_knowledge.findUnique({
        where: { id: knowledgeItem.id }
      });

      expect(knowledge?.views_count).toBe(6);
      expect(knowledge?.downloads_count).toBe(2);
    });

    it('should delete knowledge resource', async () => {
      await prisma.team_knowledge.delete({
        where: { id: knowledgeItem.id }
      });

      const knowledge = await prisma.team_knowledge.findMany({
        where: { team_id: testTeam.id }
      });

      expect(knowledge).toHaveLength(0);
    });
  });

  describe('Team Search and Filtering', () => {
    const additionalTeams: any[] = [];

    beforeAll(async () => {
      // Create additional teams for search testing
      const teamTypes = ['DEPARTMENT', 'COMMITTEE', 'PROJECT'];
      
      for (let i = 0; i < 3; i++) {
        const team = await prisma.teams.create({
          data: {
            id: generateCUID(),
            name: `Search Test Team ${i}`,
            code: `SEARCH_${i}_${Date.now()}`,
            type: teamTypes[i],
            status: i === 2 ? 'INACTIVE' : 'ACTIVE',
            purpose: `Search test purpose ${i}`,
            is_active: i !== 2,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        additionalTeams.push(team);
      }
    });

    afterAll(async () => {
      // Clean up additional teams
      for (const team of additionalTeams) {
        await prisma.teams.delete({
          where: { id: team.id }
        });
      }
    });

    it('should filter teams by type', async () => {
      const departments = await prisma.teams.findMany({
        where: { type: 'DEPARTMENT' }
      });

      expect(departments.length).toBeGreaterThan(0);
      expect(departments.every(t => t.type === 'DEPARTMENT')).toBe(true);
    });

    it('should filter teams by status', async () => {
      const activeTeams = await prisma.teams.findMany({
        where: { is_active: true }
      });

      expect(activeTeams.length).toBeGreaterThan(0);
      expect(activeTeams.every(t => t.is_active === true)).toBe(true);
    });

    it('should search teams by name', async () => {
      const searchResults = await prisma.teams.findMany({
        where: {
          name: {
            contains: 'Search Test',
            mode: 'insensitive'
          }
        }
      });

      expect(searchResults).toHaveLength(3);
    });

    it('should get team with member count', async () => {
      const teamWithCount = await prisma.teams.findUnique({
        where: { id: testTeam.id },
        include: {
          _count: {
            select: {
              team_members: true,
              team_knowledge: true
            }
          }
        }
      });

      expect(teamWithCount?._count.team_members).toBeGreaterThan(0);
      expect(teamWithCount?._count.team_knowledge).toBeDefined();
    });
  });

  describe('Team Statistics', () => {
    it('should calculate team statistics', async () => {
      // Get total teams count
      const totalTeams = await prisma.teams.count();
      expect(totalTeams).toBeGreaterThan(0);

      // Get active teams count
      const activeTeams = await prisma.teams.count({
        where: { is_active: true }
      });
      expect(activeTeams).toBeGreaterThan(0);

      // Get teams by type
      const teamsByType = await prisma.teams.groupBy({
        by: ['type'],
        _count: true
      });
      expect(teamsByType.length).toBeGreaterThan(0);

      // Get average team size
      const teamsWithMembers = await prisma.teams.findMany({
        include: {
          _count: {
            select: { team_members: true }
          }
        }
      });

      const avgTeamSize = teamsWithMembers.reduce((sum, team) => 
        sum + team._count.team_members, 0) / teamsWithMembers.length;
      
      expect(avgTeamSize).toBeGreaterThan(0);
    });

    it('should get team activity metrics', async () => {
      const recentKnowledge = await prisma.team_knowledge.findMany({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: { created_at: 'desc' }
      });

      expect(recentKnowledge).toBeDefined();

      const popularKnowledge = await prisma.team_knowledge.findMany({
        orderBy: { views_count: 'desc' },
        take: 10
      });

      expect(popularKnowledge).toBeDefined();
    });
  });
});
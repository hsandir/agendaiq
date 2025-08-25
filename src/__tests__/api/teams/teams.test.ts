import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/teams/route';
import { GET as GET_TEAM, PUT as PUT_TEAM, DELETE as DELETE_TEAM } from '@/app/api/teams/[id]/route';
import { GET as GET_MEMBERS, POST as POST_MEMBER, DELETE as DELETE_MEMBER } from '@/app/api/teams/[id]/members/route';
import { GET as GET_KNOWLEDGE, POST as POST_KNOWLEDGE } from '@/app/api/teams/[id]/knowledge/route';
import { prisma } from '@/lib/prisma';
import { authenticateApiRequest } from '@/lib/auth/api-auth';

// Mock auth
jest.mock('@/lib/auth/api-auth', () => ({
  authenticateApiRequest: jest.fn();
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    teams: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn();
    },
    team_members: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn();
    },
    team_knowledge: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn();
    },
    users: {
      findUnique: jest.fn();
    },
    staff: {
      findFirst: jest.fn();
    }
  }
}));

describe('Teams API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/teams', () => {
    it('should return 401 when not authenticated', async () => {
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/teams');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return teams list when authenticated', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      const mockTeams = [
        {
          id: 'team1',
          name: 'Engineering Team',
          type: 'DEPARTMENT',
          code: 'ENG001',
          status: 'ACTIVE',
          purpose: 'Software development',
          created_at: new Date(),
          updated_at: new Date(),
          _count: { team_members: 5, team_knowledge: 10 }
        }
      ];
      
      (prisma.teams.findMany as jest.Mock).mockResolvedValue(mockTeams);
      
      const request = new NextRequest('http://localhost:3000/api/teams');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.teams).toHaveLength(1);
      expect(data.teams[0].name).toBe('Engineering Team');
    });

    it('should filter teams by type', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      const request = new NextRequest('http://localhost:3000/api/teams?type=PROJECT');
      const response = await GET(request);
      
      expect(prisma.teams.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'PROJECT'
          });
        })
      );
    });
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.staff.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      
      const newTeam = {
        id: 'new-team-id',
        name: 'New Team',
        type: 'PROJECT',
        code: 'PROJ001',
        status: 'ACTIVE',
        purpose: 'New project',
        created_at: new Date(),
        updated_at: new Date();
      };
      
      (prisma.teams.create as jest.Mock).mockResolvedValue(newTeam);
      (prisma.team_members.create as jest.Mock).mockResolvedValue({});
      
      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Team',
          type: 'PROJECT',
          purpose: 'New project'
        });
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.team.name).toBe('New Team');
      expect(prisma.teams.create).toHaveBeenCalled();
      expect(prisma.team_members.create).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        body: JSON.stringify({});
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/teams/[id]', () => {
    it('should return team details', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      const mockTeam = {
        id: 'team1',
        name: 'Engineering Team',
        type: 'DEPARTMENT',
        code: 'ENG001',
        status: 'ACTIVE',
        purpose: 'Software development',
        description: 'Main engineering department',
        is_active: true,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
        team_members: [
          {
            id: 1,
            role: 'LEADER',
            joined_at: new Date(),
            user: { id: 1, email: 'leader@example.com', name: 'Team Leader' },
            staff: { id: 1, first_name: 'John', last_name: 'Doe' }
          }
        ],
        team_knowledge: [
          {
            id: 1,
            title: 'Team Guidelines',
            type: 'DOCUMENT',
            url: 'https://example.com/doc',
            created_at: new Date();
          }
        ],
        _count: { team_members: 1, team_knowledge: 1 }
      };
      
      (prisma.teams.findUnique as jest.Mock).mockResolvedValue(mockTeam);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1');
      const response = await GET_TEAM(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.team.name).toBe('Engineering Team');
      expect(data.team.team_members).toHaveLength(1);
    });

    it('should return 404 for non-existent team', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.teams.findUnique as jest.Mock).mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/teams/invalid');
      const response = await GET_TEAM(request, { params: { id: 'invalid' } });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Team not found');
    });
  });

  describe('PUT /api/teams/[id]', () => {
    it('should update team details', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValue({
        role: 'LEADER'
      });
      
      const updatedTeam = {
        id: 'team1',
        name: 'Updated Team Name',
        type: 'DEPARTMENT',
        code: 'ENG001',
        status: 'ACTIVE',
        purpose: 'Updated purpose',
        description: 'Updated description',
        is_active: true,
        metadata: { updated: true },
        created_at: new Date(),
        updated_at: new Date();
      };
      
      (prisma.teams.update as jest.Mock).mockResolvedValue(updatedTeam);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Team Name',
          purpose: 'Updated purpose',
          description: 'Updated description'
        });
      });
      
      const response = await PUT_TEAM(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.team.name).toBe('Updated Team Name');
    });

    it('should require LEADER or ADMIN role to update', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValue({
        role: 'MEMBER'
      });
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' });
      });
      
      const response = await PUT_TEAM(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toBe('Only team leaders or admins can update team');
    });
  });

  describe('DELETE /api/teams/[id]', () => {
    it('should delete team with ADMIN role', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValue({
        role: 'ADMIN'
      });
      
      (prisma.teams.delete as jest.Mock).mockResolvedValue({});
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1');
      const response = await DELETE_TEAM(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.message).toBe('Team deleted successfully');
    });

    it('should prevent deletion without ADMIN role', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValue({
        role: 'LEADER'
      });
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1');
      const response = await DELETE_TEAM(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toBe('Only team admins can delete team');
    });
  });
});

describe('Team Members API', () => {
  describe('GET /api/teams/[id]/members', () => {
    it('should return team members list', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      const mockMembers = [
        {
          id: 1,
          team_id: 'team1',
          user_id: 1,
          staff_id: 1,
          role: 'LEADER',
          joined_at: new Date(),
          user: { id: 1, email: 'leader@example.com', name: 'Leader' },
          staff: { id: 1, first_name: 'John', last_name: 'Doe' }
        },
        {
          id: 2,
          team_id: 'team1',
          user_id: 2,
          staff_id: 2,
          role: 'MEMBER',
          joined_at: new Date(),
          user: { id: 2, email: 'member@example.com', name: 'Member' },
          staff: { id: 2, first_name: 'Jane', last_name: 'Smith' }
        }
      ];
      
      (prisma.team_members.findMany as jest.Mock).mockResolvedValue(mockMembers);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/members');
      const response = await GET_MEMBERS(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.members).toHaveLength(2);
      expect(data.members[0].role).toBe('LEADER');
    });
  });

  describe('POST /api/teams/[id]/members', () => {
    it('should add new team member', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValueOnce({
        role: 'LEADER'
      });
      
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 3,
        email: 'newmember@example.com'
      });
      
      (prisma.staff.findFirst as jest.Mock).mockResolvedValue({
        id: 3
      });
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValueOnce(null);
      
      const newMember = {
        id: 3,
        team_id: 'team1',
        user_id: 3,
        staff_id: 3,
        role: 'MEMBER',
        joined_at: new Date();
      };
      
      (prisma.team_members.create as jest.Mock).mockResolvedValue(newMember);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/members', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 3,
          role: 'MEMBER'
        });
      });
      
      const response = await POST_MEMBER(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.member.user_id).toBe(3);
      expect(data.member.role).toBe('MEMBER');
    });

    it('should prevent duplicate members', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValueOnce({
        role: 'LEADER'
      });
      
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'existing@example.com'
      });
      
      (prisma.staff.findFirst as jest.Mock).mockResolvedValue({
        id: 2
      });
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 2,
        team_id: 'team1',
        user_id: 2
      });
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/members', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 2,
          role: 'MEMBER'
        });
      });
      
      const response = await POST_MEMBER(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('User is already a member of this team');
    });
  });

  describe('DELETE /api/teams/[id]/members', () => {
    it('should remove team member', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValue({
        role: 'LEADER'
      });
      
      (prisma.team_members.count as jest.Mock).mockResolvedValue(5);
      
      (prisma.team_members.delete as jest.Mock).mockResolvedValue({});
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/members?user_id=2');
      const response = await DELETE_MEMBER(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.message).toBe('Member removed successfully');
    });

    it('should prevent removing last member', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValue({
        role: 'LEADER'
      });
      
      (prisma.team_members.count as jest.Mock).mockResolvedValue(1);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/members?user_id=1');
      const response = await DELETE_MEMBER(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot remove the last member of the team');
    });
  });
});

describe('Team Knowledge API', () => {
  describe('GET /api/teams/[id]/knowledge', () => {
    it('should return team knowledge resources', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      const mockKnowledge = [
        {
          id: 1,
          team_id: 'team1',
          title: 'Team Guidelines',
          type: 'DOCUMENT',
          url: 'https://example.com/doc1',
          description: 'Team guidelines document',
          is_public: false,
          views_count: 10,
          downloads_count: 5,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: {
            user: { name: 'John Doe', email: 'john@example.com' }
          }
        }
      ];
      
      (prisma.team_knowledge.findMany as jest.Mock).mockResolvedValue(mockKnowledge);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/knowledge');
      const response = await GET_KNOWLEDGE(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.knowledge).toHaveLength(1);
      expect(data.knowledge[0].title).toBe('Team Guidelines');
    });

    it('should filter knowledge by type', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_knowledge.findMany as jest.Mock).mockResolvedValue([]);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/knowledge?type=VIDEO');
      await GET_KNOWLEDGE(request, { params: { id: 'team1' } });
      
      expect(prisma.team_knowledge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            team_id: 'team1',
            type: 'VIDEO'
          });
        })
      );
    });
  });

  describe('POST /api/teams/[id]/knowledge', () => {
    it('should create new knowledge resource', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValue({
        role: 'MEMBER',
        staff_id: 1
      });
      
      const newKnowledge = {
        id: 2,
        team_id: 'team1',
        title: 'New Resource',
        type: 'LINK',
        url: 'https://example.com/new',
        description: 'New resource description',
        is_public: false,
        views_count: 0,
        downloads_count: 0,
        created_by_staff_id: 1,
        created_at: new Date(),
        updated_at: new Date();
      };
      
      (prisma.team_knowledge.create as jest.Mock).mockResolvedValue(newKnowledge);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/knowledge', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Resource',
          type: 'LINK',
          url: 'https://example.com/new',
          description: 'New resource description'
        });
      });
      
      const response = await POST_KNOWLEDGE(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.knowledge.title).toBe('New Resource');
    });

    it('should require team membership to create knowledge', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      (authenticateApiRequest as jest.Mock as jest.Mock).mockResolvedValue(mockUser);
      
      (prisma.team_members.findFirst as jest.Mock).mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/teams/team1/knowledge', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Resource',
          type: 'LINK',
          url: 'https://example.com/new'
        });
      });
      
      const response = await POST_KNOWLEDGE(request, { params: { id: 'team1' } });
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toBe('You must be a team member to add knowledge');
    });
  });
});
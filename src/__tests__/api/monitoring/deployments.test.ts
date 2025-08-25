/**
 * Deployment Monitoring API Tests
 * Tests for /api/monitoring/deployments endpoint
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/monitoring/deployments/route';
import { withAuth } from '@/lib/auth/api-auth';

// Type definitions
interface DeploymentResponse {
  deployments?: Array<{
    id: string;
    name: string;
    url: string;
    created: number;
    state: string;
    creator: { username: string };
  }>;
  error?: string;
}

// Mock dependencies
jest.mock('@/lib/auth/api-auth');

// Mock fetch globally
global.fetch = jest.fn();

describe('/api/monitoring/deployments', () => {
  const mockRequest = (url: string = 'http://localhost:3000/api/monitoring/deployments') => {
    return new NextRequest(url)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VERCEL_TOKEN = 'test-vercel-token';
    process.env.VERCEL_TEAM_ID = 'test-team-id';
  });

  afterEach(() => {
    delete process.env.VERCEL_TOKEN;
    delete process.env.VERCEL_TEAM_ID;
  });

  describe('Authentication', () => {
    it('should require staff authentication', async () => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      (mockWithAuth as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Authentication required',
        statusCode: 401
      });

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as DeploymentResponse;

      expect(mockWithAuth).toHaveBeenCalledWith(request, { requireStaffRole: true });
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('Vercel Integration', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      (mockWithAuth as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      });
    });

    it('should return empty deployments when Vercel token is not configured', async () => {
      delete process.env.VERCEL_TOKEN;
      
      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as DeploymentResponse;

      expect(response.status).toBe(200);
      expect(data.deployments).toEqual([]);
      expect(data.message).toBe('Vercel integration not configured');
    });

    it('should handle Vercel API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as DeploymentResponse;

      expect(response.status).toBe(200);
      expect(data.deployments).toEqual([]);
      expect(data.message).toBe('Unable to fetch deployment data');
    });

    it('should transform Vercel deployments to our format', async () => {
      const mockVercelDeployments = {
        deployments: [
          {
            uid: 'dep_123',
            name: 'agendaiq',
            url: 'agendaiq-abc123.vercel.app',
            created: Date.now() - 3600000,
            state: 'READY',
            creator: {
              username: 'testuser',
              email: 'test@example.com'
            },
            meta: {
              githubCommitRef: 'main',
              githubCommitSha: 'abc123def456',
              githubCommitMessage: 'Update feature'
            },
            target: 'production'
          },
          {
            uid: 'dep_124',
            name: 'agendaiq',
            url: 'agendaiq-def456.vercel.app',
            created: Date.now() - 7200000,
            state: 'BUILDING',
            creator: {
              username: 'devuser',
              email: 'dev@example.com'
            },
            target: 'preview'
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVercelDeployments
      });

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as DeploymentResponse;

      expect(response.status).toBe(200);
      expect(data.deployments).toHaveLength(2);
      expect(data.deployments[0]).toMatchObject({
        environment: 'production',
        version: 'abc123d',
        status: 'success',
        deployedBy: 'testuser',
        url: 'https://agendaiq-abc123.vercel.app',
        rollbackAvailable: true,
        message: 'Update feature',
        branch: 'main'
      });
      expect(data.deployments[1]).toMatchObject({
        environment: 'preview',
        status: 'in_progress',
        deployedBy: 'devuser',
        rollbackAvailable: false
      });
    });

    it('should include team ID in request when configured', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deployments: [] })
      });

      const request = mockRequest();
      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('teamId=test-team-id'),
        expect.any(Object);
      );
    });
  });

  describe('Status Mapping', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      (mockWithAuth as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      });
    });

    it('should map Vercel states correctly', async () => {
      const testCases = [
        { state: 'READY', expected: 'success' },
        { state: 'ERROR', expected: 'failed' },
        { state: 'CANCELED', expected: 'failed' },
        { state: 'BUILDING', expected: 'in_progress' },
        { state: 'INITIALIZING', expected: 'in_progress' },
        { state: 'QUEUED', expected: 'in_progress' }
      ];

      for (const testCase of testCases) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deployments: [{
              uid: 'test',
              state: testCase.state,
              created: Date.now(),
              creator: { username: 'test' }
            }]
          })
        });

        const request = mockRequest();
        const response = await GET(request);
        const data = await response.json() as DeploymentResponse;

        expect(data.deployments[0].status).toBe(testCase.expected);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      (mockWithAuth as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as DeploymentResponse;

      expect(response.status).toBe(200);
      expect(data.deployments).toEqual([]);
      expect(data.message).toBe('Unable to fetch deployment data');
    });

    it('should handle unexpected errors', async () => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      (mockWithAuth as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as DeploymentResponse;

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch deployment data');
    });
  });
});
/**
 * Pipeline Monitoring API Tests
 * Tests for /api/monitoring/pipelines endpoint
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/monitoring/pipelines/route';
import { withAuth } from '@/lib/auth/api-auth';
import { getMockOctokit, MockWorkflowRunsResponse } from '@/__tests__/types/octokit-mock';
import type { AuthResult } from '@/lib/auth/auth-types';

// Mock dependencies
jest.mock('@/lib/auth/api-auth');
jest.mock('@octokit/rest');

describe('/api/monitoring/pipelines', () => {
  const mockRequest = (url: string = 'http://localhost:3000/api/monitoring/pipelines') => {
    return new NextRequest(url);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPO = 'test-repo';
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;
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
      const data = await response.json() as { error: string };

      expect(mockWithAuth).toHaveBeenCalledWith(request, { requireStaffRole: true });
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('GitHub Integration', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      (mockWithAuth as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      } as AuthResult);
    });

    it('should return empty runs when GitHub token is not configured', async () => {
      delete process.env.GITHUB_TOKEN;
      
      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as { runs: unknown[]; message: string };

      expect(response.status).toBe(200);
      expect(data.runs).toEqual([]);
      expect(data.message).toBe('GitHub integration not configured');
    });

    it('should handle GitHub API errors gracefully', async () => {
      const MockedOctokit = getMockOctokit();
      (MockedOctokit as jest.Mock).mockImplementation(() => ({
        actions: {
          listWorkflowRunsForRepo: jest.fn().mockRejectedValue(new Error('GitHub API error'))
        }
      }));

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as { runs: unknown[]; message: string };

      expect(response.status).toBe(200);
      expect(data.runs).toEqual([]);
      expect(data.message).toBe('Unable to fetch pipeline data');
    });

    it('should transform GitHub workflow runs to pipeline format', async () => {
      const mockWorkflowRuns: MockWorkflowRunsResponse = {
        total_count: 2,
        workflow_runs: [
          {
            id: 123,
            head_branch: 'main',
            head_sha: 'abc123def456',
            status: 'completed',
            conclusion: 'success',
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-10T10:05:00Z'
          },
          {
            id: 124,
            head_branch: 'feature',
            head_sha: 'def456ghi789',
            status: 'in_progress',
            conclusion: null,
            created_at: '2024-01-10T11:00:00Z',
            updated_at: '2024-01-10T11:00:00Z'
          }
        ]
      };

      const MockedOctokit = getMockOctokit();
      (MockedOctokit as jest.Mock).mockImplementation(() => ({
        actions: {
          listWorkflowRunsForRepo: jest.fn().mockResolvedValue({ data: mockWorkflowRuns })
        }
      }));

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as { runs: Array<{ id: string; branch: string; commit: string; status: string }> };

      expect(response.status).toBe(200);
      expect(data.runs).toHaveLength(2);
      expect(data.runs[0]).toMatchObject({
        id: '123',
        branch: 'main',
        commit: 'abc123def456',
        status: 'success'
      });
      expect(data.runs[1]?.status).toBe('running');
    });
  });

  describe('Status Mapping', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      (mockWithAuth as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      } as AuthResult);
    });

    it('should map GitHub statuses correctly', async () => {
      const testCases = [
        { status: 'completed', conclusion: 'success', expected: 'success' },
        { status: 'completed', conclusion: 'failure', expected: 'failed' },
        { status: 'completed', conclusion: 'cancelled', expected: 'cancelled' },
        { status: 'in_progress', conclusion: null, expected: 'running' },
        { status: 'queued', conclusion: null, expected: 'pending' }
      ];

      for (const testCase of testCases) {
        const MockedOctokit = getMockOctokit();
        (MockedOctokit as jest.Mock).mockImplementation(() => ({
          actions: {
            listWorkflowRunsForRepo: jest.fn().mockResolvedValue({
              data: {
                workflow_runs: [{
                  id: 1,
                  status: testCase.status as 'queued' | 'in_progress' | 'completed',
                  conclusion: testCase.conclusion as 'success' | 'failure' | 'cancelled' | null,
                  head_branch: 'main',
                  head_sha: 'abc123',
                  created_at: '2024-01-10T10:00:00Z',
                  updated_at: '2024-01-10T10:00:00Z'
                }]
              }
            })
          }
        }));

        const request = mockRequest();
        const response = await GET(request);
        const data = await response.json() as { runs: Array<{ status: string }> };

        expect(data.runs[0]?.status).toBe(testCase.expected);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors', async () => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      (mockWithAuth as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json() as { error: string };

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch pipeline data');
    });
  });
});
/**
 * Build Metrics API Tests
 * Tests for /api/monitoring/build-metrics endpoint
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/monitoring/build-metrics/route';
import { withAuth } from '@/lib/auth/api-auth';
import * as Sentry from '@sentry/nextjs';

// Mock dependencies
jest.mock('@/lib/auth/api-auth');
jest.mock('@octokit/rest');
jest.mock('@sentry/nextjs');

// Mock fetch globally
global.fetch = jest.fn();

describe('/api/monitoring/build-metrics', () => {
  const mockRequest = (url: string = 'http://localhost:3000/api/monitoring/build-metrics') => {
    return new NextRequest(url);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GITHUB_TOKEN = 'test-github-token';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPO = 'test-repo';
    process.env.SENTRY_AUTH_TOKEN = 'test-sentry-token';
    process.env.NEXT_PUBLIC_SENTRY_ORG = 'test-org';
    process.env.NEXT_PUBLIC_SENTRY_PROJECT = 'test-project';
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.SENTRY_AUTH_TOKEN;
  });

  describe('Authentication', () => {
    it('should require staff authentication', async () => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      mockWithAuth.mockResolvedValueOnce({
        success: false,
        error: 'Authentication required',
        statusCode: 401
      });

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(mockWithAuth).toHaveBeenCalledWith(request, { requireStaffRole: true });
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('Metrics Calculation', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      mockWithAuth.mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      });
    });

    it('should return default metrics when integrations are not configured', async () => {
      delete process.env.GITHUB_TOKEN;
      delete process.env.SENTRY_AUTH_TOKEN;

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics).toMatchObject({
        totalBuilds: 0,
        successRate: 0,
        averageDuration: 0,
        queueTime: 0,
        testsPassed: 0,
        testsFailed: 0,
        codeCoverage: 0,
        vulnerabilities: 0,
        errorRate: 0.15,
        crashFreeUsers: 99.7,
        p95Latency: 400,
        activeIssues: 3
      });
    });

    it('should calculate GitHub metrics correctly', async () => {
      const mockWorkflowRuns = {
        total_count: 100,
        workflow_runs: [
          {
            id: 1,
            conclusion: 'success',
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-10T10:05:00Z'
          },
          {
            id: 2,
            conclusion: 'success',
            created_at: '2024-01-10T09:00:00Z',
            updated_at: '2024-01-10T09:10:00Z'
          },
          {
            id: 3,
            conclusion: 'failure',
            created_at: '2024-01-10T08:00:00Z',
            updated_at: '2024-01-10T08:03:00Z'
          }
        ]
      };

      const Octokit = jest.requireMock('@octokit/rest').Octokit;
      Octokit.mockImplementation(() => ({
        actions: {
          listWorkflowRunsForRepo: jest.fn().mockResolvedValue({ data: mockWorkflowRuns }),
          listWorkflowRunArtifacts: jest.fn().mockResolvedValue({
            data: {
              artifacts: [
                { name: 'test-results', size: 1024 },
                { name: 'coverage-report', size: 2048 }
              ]
            }
          })
        }
      }));

      // Mock Sentry API responses
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] })
      });

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics.totalBuilds).toBe(100);
      expect(data.metrics.successRate).toBeCloseTo(66.67, 1); // 2 out of 3 success
      expect(data.metrics.averageDuration).toBeGreaterThan(0);
      expect(data.metrics.testsPassed).toBe(150);
      expect(data.metrics.testsFailed).toBe(2);
      expect(data.metrics.codeCoverage).toBe(75.5);
    });

    it('should fetch Sentry metrics when configured', async () => {
      const Octokit = jest.requireMock('@octokit/rest').Octokit;
      Octokit.mockImplementation(() => ({
        actions: {
          listWorkflowRunsForRepo: jest.fn().mockResolvedValue({ data: { workflow_runs: [] } })
        }
      }));

      // Mock Sentry crash-free users response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [[1234567890, [{ count: 0.985 }]]]
          })
        })
        // Mock error rate response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [[1234567890, [{ count: 25 }]]]
          })
        })
        // Mock issues response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [1, 2, 3, 4, 5]
        });

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics.crashFreeUsers).toBe(98.5);
      expect(data.metrics.errorRate).toBeCloseTo(0.25, 2);
      expect(data.metrics.activeIssues).toBe(5);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      mockWithAuth.mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      });
    });

    it('should handle GitHub API errors gracefully', async () => {
      const Octokit = jest.requireMock('@octokit/rest').Octokit;
      Octokit.mockImplementation(() => ({
        actions: {
          listWorkflowRunsForRepo: jest.fn().mockRejectedValue(new Error('GitHub API error'))
        }
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] })
      });

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics).toBeDefined();
      expect(data.metrics.totalBuilds).toBe(0);
    });

    it('should handle Sentry API errors gracefully', async () => {
      const Octokit = jest.requireMock('@octokit/rest').Octokit;
      Octokit.mockImplementation(() => ({
        actions: {
          listWorkflowRunsForRepo: jest.fn().mockResolvedValue({ data: { workflow_runs: [] } })
        }
      }));

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Sentry API error'));

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics).toBeDefined();
      expect(data.metrics.errorRate).toBe(0.2);
      expect(data.metrics.crashFreeUsers).toBe(99.5);
    });

    it('should capture exceptions to Sentry on errors', async () => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      mockWithAuth.mockReset();
      mockWithAuth.mockRejectedValueOnce(new Error('Unexpected error'));

      const mockCaptureException = Sentry.captureException as jest.MockedFunction<typeof Sentry.captureException>;

      const request = mockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            component: 'build-metrics-api',
            action: 'fetch-metrics'
          }
        })
      );
    });
  });

  describe('Metrics Structure', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      mockWithAuth.mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      });
    });

    it('should return all required metric fields', async () => {
      const Octokit = jest.requireMock('@octokit/rest').Octokit;
      Octokit.mockImplementation(() => ({
        actions: {
          listWorkflowRunsForRepo: jest.fn().mockResolvedValue({ data: { workflow_runs: [] } })
        }
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false
      });

      const request = mockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics).toHaveProperty('totalBuilds');
      expect(data.metrics).toHaveProperty('successRate');
      expect(data.metrics).toHaveProperty('averageDuration');
      expect(data.metrics).toHaveProperty('queueTime');
      expect(data.metrics).toHaveProperty('testsPassed');
      expect(data.metrics).toHaveProperty('testsFailed');
      expect(data.metrics).toHaveProperty('codeCoverage');
      expect(data.metrics).toHaveProperty('vulnerabilities');
      expect(data.metrics).toHaveProperty('errorRate');
      expect(data.metrics).toHaveProperty('crashFreeUsers');
      expect(data.metrics).toHaveProperty('p95Latency');
      expect(data.metrics).toHaveProperty('activeIssues');
    });
  });
});
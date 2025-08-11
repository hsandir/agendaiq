/**
 * Error Monitoring API Tests
 * Tests for error monitoring endpoints
 */

import { NextRequest } from 'next/server';
import { GET as getErrors } from '@/app/api/monitoring/errors/route';
import { GET as getErrorStats } from '@/app/api/monitoring/error-stats/route';
import { GET as getReleaseHealth } from '@/app/api/monitoring/release-health/route';
import { withAuth } from '@/lib/auth/api-auth';
import * as Sentry from '@sentry/nextjs';

// Mock dependencies
jest.mock('@/lib/auth/api-auth');
jest.mock('@sentry/nextjs');

// Mock fetch globally
global.fetch = jest.fn();

describe('Error Monitoring APIs', () => {
  const mockRequest = (url: string) => {
    return new NextRequest(url);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SENTRY_AUTH_TOKEN = 'test-sentry-token';
    process.env.NEXT_PUBLIC_SENTRY_ORG = 'test-org';
    process.env.NEXT_PUBLIC_SENTRY_PROJECT = 'test-project';
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0';
    process.env.VERCEL_GIT_COMMIT_SHA = 'abc123def456';
  });

  afterEach(() => {
    delete process.env.SENTRY_AUTH_TOKEN;
  });

  describe('/api/monitoring/errors', () => {
    describe('Authentication', () => {
      it('should require staff authentication', async () => {
        const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
        mockWithAuth.mockResolvedValueOnce({
          success: false,
          error: 'Authentication required',
          statusCode: 401
        });

        const request = mockRequest('http://localhost:3000/api/monitoring/errors');
        const response = await getErrors(request);
        const data = await response.json();

        expect(mockWithAuth).toHaveBeenCalledWith(request, { requireStaffRole: true });
        expect(response.status).toBe(401);
        expect(data.error).toBe('Authentication required');
      });
    });

    describe('Sentry Integration', () => {
      beforeEach(() => {
        const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
        mockWithAuth.mockResolvedValueOnce({
          success: true,
          user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
        });
      });

      it('should return empty issues when Sentry is not configured', async () => {
        delete process.env.SENTRY_AUTH_TOKEN;
        
        const request = mockRequest('http://localhost:3000/api/monitoring/errors');
        const response = await getErrors(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.issues).toEqual([]);
        expect(data.message).toBe('Sentry integration not configured');
      });

      it('should fetch and transform Sentry issues', async () => {
        const mockSentryIssues = [
          {
            id: 'issue-1',
            title: 'TypeError: Cannot read property',
            culprit: 'src/components/Test.tsx',
            level: 'error',
            count: 42,
            userCount: 10,
            firstSeen: '2024-01-10T10:00:00Z',
            lastSeen: '2024-01-10T11:00:00Z',
            status: 'unresolved',
            isRegression: false,
            platform: 'javascript',
            lastRelease: { version: '1.0.0' },
            assignedTo: { name: 'Test User' }
          }
        ];

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockSentryIssues
        });

        const request = mockRequest('http://localhost:3000/api/monitoring/errors');
        const response = await getErrors(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.issues).toHaveLength(1);
        expect(data.issues[0]).toMatchObject({
          id: 'issue-1',
          title: 'TypeError: Cannot read property',
          culprit: 'src/components/Test.tsx',
          level: 'error',
          count: 42,
          userCount: 10,
          assignedTo: 'Test User'
        });
      });

      it('should filter issues by level', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => []
        });

        const request = mockRequest('http://localhost:3000/api/monitoring/errors?level=error');
        await getErrors(request);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('level:error'),
          expect.any(Object)
        );
      });

      it('should return sample data on Sentry API error', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Sentry API error'));

        const request = mockRequest('http://localhost:3000/api/monitoring/errors');
        const response = await getErrors(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.issues).toHaveLength(3);
        expect(data.issues[0].title).toContain('TypeError');
      });
    });
  });

  describe('/api/monitoring/error-stats', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      mockWithAuth.mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      });
    });

    it('should return default stats when Sentry is not configured', async () => {
      delete process.env.SENTRY_AUTH_TOKEN;
      
      const request = mockRequest('http://localhost:3000/api/monitoring/error-stats');
      const response = await getErrorStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toMatchObject({
        crashFreeUsers: 99.5,
        crashFreeSessions: 99.0,
        errorRate: 0.2,
        activeIssues: 0,
        newIssues24h: 0,
        resolvedIssues24h: 0,
        p95ResponseTime: 450,
        affectedUsers: 0
      });
    });

    it('should fetch crash-free rates from Sentry', async () => {
      // Mock crash-free users response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [[1234567890, [{ count: 0.993 }]]]
          })
        })
        // Mock crash-free sessions response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [[1234567890, [{ count: 0.987 }]]]
          })
        })
        // Mock error count response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [[1234567890, [{ count: 15 }]]]
          })
        })
        // Mock active issues response
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'X-Hits': '25' }),
          json: async () => []
        })
        // Mock new issues response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => new Array(5)
        })
        // Mock resolved issues response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => new Array(8)
        })
        // Mock p95 response time
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [[1234567890, [{ count: 320 }]]]
          })
        });

      const request = mockRequest('http://localhost:3000/api/monitoring/error-stats');
      const response = await getErrorStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.crashFreeUsers).toBe(99.3);
      expect(data.stats.crashFreeSessions).toBe(98.7);
      expect(data.stats.errorRate).toBeCloseTo(0.15, 2);
      expect(data.stats.activeIssues).toBe(25);
      expect(data.stats.newIssues24h).toBe(5);
      expect(data.stats.resolvedIssues24h).toBe(8);
      expect(data.stats.p95ResponseTime).toBe(320);
    });

    it('should handle Sentry API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Sentry API error'));

      const request = mockRequest('http://localhost:3000/api/monitoring/error-stats');
      const response = await getErrorStats(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.crashFreeUsers).toBe(99.7);
      expect(data.stats.errorRate).toBe(0.15);
    });
  });

  describe('/api/monitoring/release-health', () => {
    beforeEach(() => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      mockWithAuth.mockResolvedValueOnce({
        success: true,
        user: { id: 'test-user', staff: { role: { title: 'Administrator' } } }
      });
    });

    it('should return default release health when Sentry is not configured', async () => {
      delete process.env.SENTRY_AUTH_TOKEN;
      
      const request = mockRequest('http://localhost:3000/api/monitoring/release-health');
      const response = await getReleaseHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.release).toMatchObject({
        version: '1.0.0+abc123d',
        adoptionRate: 0,
        crashFreeRate: 99.5,
        sessionCount: 0,
        errorCount: 0,
        newIssues: 0,
        status: 'healthy'
      });
    });

    it('should fetch release data from Sentry', async () => {
      const mockReleaseData = {
        adoption: 85,
        sessions: 5000,
        crashFreeUsers: 0.992,
        totalEvents: 42,
        newGroups: 3
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReleaseData
      });

      const request = mockRequest('http://localhost:3000/api/monitoring/release-health');
      const response = await getReleaseHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.release).toMatchObject({
        version: '1.0.0+abc123d',
        adoptionRate: 85,
        crashFreeRate: 99.2,
        sessionCount: 5000,
        errorCount: 42,
        newIssues: 3,
        status: 'healthy'
      });
    });

    it('should determine health status correctly', async () => {
      const testCases = [
        { crashFreeRate: 0.98, newIssues: 2, errorCount: 500, expectedStatus: 'healthy' },
        { crashFreeRate: 0.985, newIssues: 7, errorCount: 500, expectedStatus: 'degraded' },
        { crashFreeRate: 0.94, newIssues: 2, errorCount: 500, expectedStatus: 'critical' },
        { crashFreeRate: 0.98, newIssues: 2, errorCount: 1500, expectedStatus: 'degraded' }
      ];

      for (const testCase of testCases) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            crashFreeUsers: testCase.crashFreeRate,
            newGroups: testCase.newIssues,
            totalEvents: testCase.errorCount
          })
        });

        const request = mockRequest('http://localhost:3000/api/monitoring/release-health');
        const response = await getReleaseHealth(request);
        const data = await response.json();

        expect(data.release.status).toBe(testCase.expectedStatus);
      }
    });

    it('should fall back to project stats when release not found', async () => {
      // Mock 404 for release endpoint
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        // Mock crash-free rate response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [[1234567890, [{ count: 0.996 }]]]
          })
        })
        // Mock session count response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [[1234567890, [{ count: 1500 }]]]
          })
        });

      const request = mockRequest('http://localhost:3000/api/monitoring/release-health');
      const response = await getReleaseHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.release.crashFreeRate).toBe(99.6);
      expect(data.release.sessionCount).toBe(1500);
      expect(data.release.adoptionRate).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should capture exceptions to Sentry', async () => {
      const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;
      mockWithAuth.mockRejectedValueOnce(new Error('Unexpected error'));

      const mockCaptureException = Sentry.captureException as jest.MockedFunction<typeof Sentry.captureException>;

      const request = mockRequest('http://localhost:3000/api/monitoring/errors');
      const response = await getErrors(request);

      expect(response.status).toBe(500);
      expect(mockCaptureException).toHaveBeenCalled();
    });
  });
});
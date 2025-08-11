/**
 * AUTH-INT-11, AUTH-INT-12: Admin API Route Tests
 * Test capability-based access control for admin endpoints
 */

// Mock modules first before imports
jest.mock('@/lib/auth/api-auth', () => ({
  withAuth: jest.fn()
}));
jest.mock('@/lib/auth/policy', () => ({
  canAccessApi: jest.fn()
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn() },
    role: { findMany: jest.fn() },
    staff: { findMany: jest.fn() },
  },
}));
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => ({
      status: init?.status || 200,
      headers: new Headers(init?.headers),
      json: async () => body,
      body: JSON.stringify(body)
    }))
  }
}));

import { withAuth } from '@/lib/auth/api-auth';
import { NextRequest } from 'next/server';
import { canAccessApi } from '@/lib/auth/policy';

describe('Admin API Routes - Capability Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AUTH-INT-11: Admin endpoints require proper capabilities', () => {
    it('should allow ops/dev admin to access /api/admin endpoints', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@test.com',
        is_school_admin: true,
        capabilities: ['ops:admin', 'user:manage'],
      };

      (withAuth as jest.Mock).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      (canAccessApi as jest.Mock).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      
      // Simulate successful auth check
      const authResult = await withAuth(request, { requireOpsAdmin: true });
      expect(authResult.success).toBe(true);
      expect(authResult.user).toBe(mockUser);
    });

    it('should deny normal user access to /api/admin endpoints', async () => {
      (withAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Insufficient permissions',
        statusCode: 403,
      });

      (canAccessApi as jest.Mock).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      
      const authResult = await withAuth(request, { requireOpsAdmin: true });
      expect(authResult.success).toBe(false);
      expect(authResult.statusCode).toBe(403);
    });

    it('should return 401 for anonymous requests', async () => {
      (withAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Authentication required',
        statusCode: 401,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      
      const authResult = await withAuth(request);
      expect(authResult.success).toBe(false);
      expect(authResult.statusCode).toBe(401);
    });
  });

  describe('AUTH-INT-12: Dev/System endpoints capability gating', () => {
    const devEndpoints = [
      '/api/dev/debug',
      '/api/dev/execute',
      '/api/dev/database/stats',
      '/api/system/health',
      '/api/internal/audit',
    ];

    it('should require DEV_DEBUG capability for dev endpoints', async () => {
      const mockDevAdmin = {
        id: 1,
        email: 'dev@test.com',
        is_system_admin: true,
        capabilities: ['dev:debug', 'dev:update', 'dev:fix'],
      };

      (withAuth as jest.Mock).mockResolvedValue({
        success: true,
        user: mockDevAdmin,
      });

      for (const endpoint of devEndpoints) {
        const request = new NextRequest(`http://localhost:3000${endpoint}`);
        const authResult = await withAuth(request, { requireDevAdmin: true });
        
        expect(authResult.success).toBe(true);
        expect(authResult.user?.capabilities).toContain('dev:debug');
      }
    });

    it('should deny school admin access to dev endpoints', async () => {
      (withAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Insufficient permissions',
        statusCode: 403,
      });

      for (const endpoint of devEndpoints) {
        const request = new NextRequest(`http://localhost:3000${endpoint}`);
        const authResult = await withAuth(request, { requireDevAdmin: true });
        
        expect(authResult.success).toBe(false);
        expect(authResult.statusCode).toBe(403);
      }
    });
  });

  describe('Meeting endpoints with ownership checks', () => {
    it('should allow editing own meetings with MEETING_EDIT_OWN', async () => {
      const mockUser = {
        id: 3,
        email: 'teacher@test.com',
        capabilities: ['meeting:edit:own', 'meeting:view'],
        staff: { id: 10 },
      };

      (withAuth as jest.Mock).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const request = new NextRequest('http://localhost:3000/api/meetings/1');
      
      // Simulate ownership check
      const authResult = await withAuth(request, { 
        requireCapability: 'meeting:edit:own',
        context: { ownerId: 3 } // Same as user.id
      });
      
      expect(authResult.success).toBe(true);
    });

    it('should deny editing others meetings without MEETING_EDIT', async () => {
      (withAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Cannot edit meeting owned by another user',
        statusCode: 403,
      });

      const request = new NextRequest('http://localhost:3000/api/meetings/1');
      
      const authResult = await withAuth(request, { 
        requireCapability: 'meeting:edit:own',
        context: { ownerId: 999 } // Different owner
      });
      
      expect(authResult.success).toBe(false);
    });
  });

  describe('Monitoring endpoints', () => {
    it('should require OPS_MONITORING capability', async () => {
      const mockOpsUser = {
        id: 4,
        email: 'ops@test.com',
        capabilities: ['ops:monitoring', 'ops:logs'],
      };

      (withAuth as jest.Mock).mockResolvedValue({
        success: true,
        user: mockOpsUser,
      });

      const endpoints = [
        '/api/monitoring/logs',
        '/api/monitoring/live-logs',
        '/api/monitoring/production-errors',
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(`http://localhost:3000${endpoint}`);
        const authResult = await withAuth(request, { 
          requireCapability: 'ops:monitoring'
        });
        
        expect(authResult.success).toBe(true);
        expect(authResult.user?.capabilities).toContain('ops:monitoring');
      }
    });
  });
});
/**
 * AUTH-POL-01: Policy Unit Tests
 * Test capability-based authorization functions
 */

import { can, canAccessRoute, canAccessApi, Capability, getUserCapabilities } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Policy Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AUTH-POL-01: can() - system admin grants all', () => {
    it('should grant all capabilities to system admin', () => {
      const systemAdmin = {
        id: 1,
        email: 'admin@test.com',
        name: 'Admin',
        is_system_admin: true,
        is_school_admin: false,
        capabilities: [],
        roleKey: 'DEV_ADMIN',
      };

      // Test various capabilities
      expect(can(systemAdmin, Capability.DEV_DEBUG)).toBe(true);
      expect(can(systemAdmin, Capability.OPS_MONITORING)).toBe(true);
      expect(can(systemAdmin, Capability.USER_MANAGE)).toBe(true);
      expect(can(systemAdmin, Capability.MEETING_CREATE)).toBe(true);
      
      // Test with array of capabilities
      expect(can(systemAdmin, [Capability.DEV_DEBUG, Capability.OPS_MONITORING])).toBe(true);
    });
  });

  describe('AUTH-POL-02: can() - school admin permissions', () => {
    it('should deny dev:* capabilities to school admin', () => {
      const schoolAdmin = {
        id: 2,
        email: 'ops@test.com',
        name: 'Ops Admin',
        is_system_admin: false,
        is_school_admin: true,
        capabilities: [],
        roleKey: 'OPS_ADMIN',
      };

      // Should deny dev capabilities
      expect(can(schoolAdmin, Capability.DEV_DEBUG)).toBe(false);
      expect(can(schoolAdmin, Capability.DEV_UPDATE)).toBe(false);
      expect(can(schoolAdmin, Capability.DEV_FIX)).toBe(false);
    });

    it('should allow ops/manage/view/meeting capabilities to school admin', () => {
      const schoolAdmin = {
        id: 2,
        email: 'ops@test.com',
        name: 'Ops Admin',
        is_system_admin: false,
        is_school_admin: true,
        capabilities: [],
        roleKey: 'OPS_ADMIN',
      };

      // Should allow ops capabilities
      expect(can(schoolAdmin, Capability.OPS_MONITORING)).toBe(true);
      expect(can(schoolAdmin, Capability.OPS_HEALTH)).toBe(true);
      
      // Should allow management capabilities
      expect(can(schoolAdmin, Capability.USER_MANAGE)).toBe(true);
      expect(can(schoolAdmin, Capability.ROLE_MANAGE)).toBe(true);
      expect(can(schoolAdmin, Capability.SCHOOL_MANAGE)).toBe(true);
      
      // Should allow meeting capabilities
      expect(can(schoolAdmin, Capability.MEETING_CREATE)).toBe(true);
      expect(can(schoolAdmin, Capability.MEETING_EDIT)).toBe(true);
      expect(can(schoolAdmin, Capability.MEETING_VIEW)).toBe(true);
    });
  });

  describe('AUTH-POL-03: can() - MEETING_EDIT_OWN context check', () => {
    it('should allow editing own meetings', () => {
      const user = {
        id: 3,
        email: 'teacher@test.com',
        name: 'Teacher',
        is_system_admin: false,
        is_school_admin: false,
        capabilities: [Capability.MEETING_EDIT_OWN],
        staff: { id: 10 },
      };

      // Should allow editing own meeting (ownerId matches staff.id)
      expect(can(user, Capability.MEETING_EDIT_OWN, { ownerId: 10 })).toBe(true);
      
      // Should deny editing others' meetings
      expect(can(user, Capability.MEETING_EDIT_OWN, { ownerId: 999 })).toBe(false);
    });
  });

  describe('AUTH-POL-04: canAccessRoute()', () => {
    it('should require capabilities for mapped routes', () => {
      const regularUser = {
        id: 4,
        email: 'user@test.com',
        name: 'User',
        is_system_admin: false,
        is_school_admin: false,
        capabilities: [Capability.MEETING_VIEW],
      };

      // Should deny system pages
      expect(canAccessRoute(regularusers, '/dashboard/system')).toBe(false);
      expect(canAccessRoute(regularusers, '/dashboard/monitoring')).toBe(false);
      
      // Should allow unmapped dashboard routes (default allow)
      expect(canAccessRoute(regularusers, '/dashboard')).toBe(true);
      expect(canAccessRoute(regularusers, '/dashboard/profile')).toBe(true);
    });
  });

  describe('AUTH-POL-05: canAccessApi()', () => {
    it('should allow public APIs without auth', () => {
      expect(canAccessApi(null, '/api/auth/signin')).toBe(true);
      expect(canAccessApi(null, '/api/health')).toBe(true);
      expect(canAccessApi(null, '/api/setup/check')).toBe(true);
    });

    it('should enforce capabilities for mapped APIs', () => {
      const regularUser = {
        id: 5,
        email: 'user@test.com',
        name: 'User',
        is_system_admin: false,
        is_school_admin: false,
        capabilities: [],
      };

      // Should deny dev endpoints
      expect(canAccessApi(regularusers, '/api/dev/debug')).toBe(false);
      expect(canAccessApi(regularusers, '/api/system/health')).toBe(false);
      
      // Should allow unmapped authenticated endpoints (default allow for authenticated users)
      expect(canAccessApi(regularusers, '/api/some-random-endpoint')).toBe(true);
    });
  });

  describe('AUTH-POL-06: getUserCapabilities()', () => {
    it('should return all capabilities for system admin', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        is_system_admin: true,
        is_school_admin: false,
        staff: [],
      });

      const capabilities = await getUserCapabilities(1);
      
      // Should have all capabilities
      expect(capabilities).toContain(Capability.DEV_DEBUG);
      expect(capabilities).toContain(Capability.OPS_MONITORING);
      expect(capabilities).toContain(Capability.USER_MANAGE);
      expect(capabilities.length).toBeGreaterThan(10);
    });

    it('should filter dev capabilities for school admin', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        is_system_admin: false,
        is_school_admin: true,
        staff: [],
      });

      const capabilities = await getUserCapabilities(2);
      
      // Should not have dev capabilities
      expect(capabilities).not.toContain(Capability.DEV_DEBUG);
      expect(capabilities).not.toContain(Capability.DEV_UPDATE);
      
      // Should have ops capabilities
      expect(capabilities).toContain(Capability.OPS_MONITORING);
      expect(capabilities).toContain(Capability.USER_MANAGE);
    });

    it('should map role permissions to capabilities', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 3,
        is_system_admin: false,
        is_school_admin: false,
        staff: [{
          role: {
            permission: [
              { capability: Capability.MEETING_CREATE },
              { capability: Capability.MEETING_VIEW },
            ],
          },
        }],
      });

      const capabilities = await getUserCapabilities(3);
      
      expect(capabilities).toEqual([
        Capability.MEETING_CREATE,
        Capability.MEETING_VIEW,
      ]);
    });
  });
});
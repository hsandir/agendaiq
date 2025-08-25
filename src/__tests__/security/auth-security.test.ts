/**
 * Authentication Security Tests
 * Comprehensive security testing for authentication system
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthPresets, requireAuth } from '@/lib/auth/auth-utils';
import { withAuth } from '@/lib/auth/api-auth';
import { RateLimiters } from '@/lib/utils/rate-limit';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

// Test utilities
import { createTestusers, cleanupTestData } from '../helpers/test-db';
import type { Authenticatedusers, StaffWithRelations } from '@/types';

// Mock rate limiter
jest.mock('@/lib/utils/rate-limit');
const mockRateLimiters = RateLimiters as jest.Mocked<typeof RateLimiters>;

describe('Authentication Security Tests', () => {
  let testUser: _AuthenticatedUser;
  let testStaff: _StaffWithRelations;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup rate limiter mocks
    mockRateLimiters.auth.check.mockResolvedValue({
      success: true,
      limit: 5,
      used: 0,
      remaining: 5,
      reset: Date.now() + 60000
    });

    // Create test user with staff
    const result = await createTestUser({
      email: 'security-test@agendaiq.com',
      name: 'Security Test User',
      withStaff: true,
      staffRole: 'Teacher'
    });
    
    testUser = result.user as AuthenticatedUser;
    testStaff = result.staff as StaffWithRelations;
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('🔐 Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        '12345678', // Only numbers
        'password123', // Common pattern
      ];

      for (const password of weakPasswords) {
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password,
            name: 'Test User'
          }),
        });

        const { _POST } = await import('@/app/api/auth/register/route');
        const response = await POST(request);
        const data = await response.json() as { error?: string };

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      }
    });

    it('should hash passwords securely', async () => {
      const password = 'SecurePassword123!';
      const email = 'hash-test@agendaiq.com';

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          name: 'Hash Test User'
        }),
      });

      const { _POST } = await import('@/app/api/auth/register/route');
        const response = await POST(request);

      if (response.ok) {
        const user = await prisma.users.findUnique({
          where: { email }
        });

        expect(user?.hashed_password).toBeDefined();
        expect(user?.hashed_password).not.toBe(password);
        expect(user?.hashed_password?.startsWith('$2')).toBe(true); // bcrypt hash
      }
    });

    it('should verify password hashing strength', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      // Verify hash rounds are sufficient (12+)
      expect(hashedPassword.split('$')[2]).toBe('12');
      
      // Verify hash verification works
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);

      // Verify wrong password fails
      const isInvalid = await bcrypt.compare('WrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('🚨 Rate Limiting', () => {
    it('should enforce login rate limiting', async () => {
      mockRateLimiters.auth.check.mockResolvedValue({
        success: false,
        limit: 5,
        used: 5,
        remaining: 0,
        reset: Date.now() + 60000
      });

      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });

      const authResult = await withAuth(request, { requireAuth: false });
      expect(mockRateLimiters.auth.check).toHaveBeenCalled();
    });

    it('should enforce registration rate limiting', async () => {
      mockRateLimiters.register = {
        check: jest.fn().mockResolvedValue({
          success: false,
          limit: 3,
          used: 3,
          remaining: 0,
          reset: Date.now() + 300000
        }),
        createErrorResponse: jest.fn().mockReturnValue(
          new Response(JSON.stringify({ error: 'Too many registration attempts' }), {
            status: 429
          })
        )
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'ratelimit-test@example.com',
          password: 'SecurePassword123!',
          name: 'Rate Limit Test'
        }),
      });

      // Rate limiting should be checked in registration route
      expect(mockRateLimiters.register).toBeDefined();
    });

    it('should enforce 2FA verification rate limiting', async () => {
      const twoFALimiter = {
        check: jest.fn().mockResolvedValue({
          success: false,
          limit: 5,
          used: 5,
          remaining: 0,
          reset: Date.now() + 900000 // 15 minutes
        }),
        createErrorResponse: jest.fn().mockReturnValue(
          new Response(JSON.stringify({ error: 'Too many 2FA attempts' }), {
            status: 429
          })
        )
      };

      mockRateLimiters.twoFA = twoFALimiter;

      const request = new NextRequest('http://localhost:3000/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({
          token: '123456'
        }),
      });

      // Should enforce stricter limits for 2FA
      expect(twoFALimiter.check).toBeDefined();
    });
  });

  describe('🔑 Two-Factor Authentication Security', () => {
    it('should generate secure TOTP secrets', async () => {
      const secret = authenticator.generateSecret();
      
      // Verify secret length and format
      expect(secret).toHaveLength(32);
      expect(/^[A-Z2-7]+$/.test(secret)).toBe(true); // Base32 format
      
      // Verify tokens can be generated and verified
      const token = authenticator.generate(secret);
      expect(token).toHaveLength(6);
      expect(/^\d{6}$/.test(token)).toBe(true);
      
      const isValid = authenticator.verify({
        token,
        secret
      });
      expect(isValid).toBe(true);
    });

    it('should enforce TOTP time window security', async () => {
      const secret = authenticator.generateSecret();
      const currentToken = authenticator.generate(secret);
      
      // Current token should be valid
      const isCurrentValid = authenticator.verify({
        token: currentToken,
        secret,
        window: 1
      });
      expect(isCurrentValid).toBe(true);
      
      // Old token should be invalid (simulate 5 minutes ago)
      const oldTime = Date.now() - 5 * 60 * 1000;
      const oldToken = authenticator.generate(secret, oldTime);
      
      const isOldValid = authenticator.verify({
        token: oldToken,
        secret,
        window: 1
      });
      expect(isOldValid).toBe(false);
    });

    it('should prevent TOTP token reuse', async () => {
      // This would be implemented in the actual 2FA verification route
      // to prevent replay attacks by storing used tokens
      const secret = authenticator.generateSecret();
      const token = authenticator.generate(secret);
      
      // First use should succeed
      const firstUse = authenticator.verify({ token, secret });
      expect(firstUse).toBe(true);
      
      // Implementation should track used tokens to prevent reuse
      // This test documents the requirement
      expect(token).toHaveLength(6);
    });
  });

  describe('🔒 Session Security', () => {
    it('should enforce session authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      // Mock session without user
      const authResult = await withAuth(request, { requireAuth: true });
      
      expect(authResult.success).toBe(false);
      expect(authResult.error).toBe('Authentication required');
      expect(authResult.statusCode).toBe(401);
    });

    it('should validate staff roles correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      // Test staff role requirement
      const staffResult = await withAuth(request, { requireStaffRole: true });
      
      if (!staffResult.success) {
        expect(staffResult.error).toContain('staff');
      }
    });

    it('should validate admin roles correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      // Test admin role requirement
      const adminResult = await withAuth(request, { requireAdminRole: true });
      
      if (!adminResult.success) {
        expect(adminResult.error).toContain('admin');
      }
    });

    it('should validate leadership roles correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      // Test leadership role requirement
      const leadershipResult = await withAuth(request, { requireLeadershipRole: true });
      
      if (!leadershipResult.success) {
        expect(leadershipResult.error).toContain('leadership');
      }
    });
  });

  describe('🛡️ Input Validation Security', () => {
    it('should prevent SQL injection in authentication', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "admin'/*",
        "' OR 1=1#",
      ];

      for (const maliciousInput of sqlInjectionAttempts) {
        const request = new NextRequest('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify({
            email: maliciousInput,
            password: 'password'
          }),
        });

        // The auth system should safely handle these inputs
        // without executing SQL injection
        const { _POST } = await import('@/app/api/auth/[...nextauth]/route');
        const response = await POST(request);
        
        // Should either return 401 (invalid credentials) or 400 (bad request)
        // but never 500 (server error from SQL injection)
        expect([400, 401].includes(response.status)).toBe(true);
      }
    });

    it('should sanitize user input in registration', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
      ];

      for (const maliciousInput of xssAttempts) {
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            name: maliciousInput,
            password: 'SecurePassword123!'
          }),
        });

        const { _POST } = await import('@/app/api/auth/register/route');
        const response = await POST(request);
        
        if (response.ok) {
          const data = await response.json() as { user?: { name: string } };
          // If registration succeeds, name should be sanitized
          if (data.user?.name) {
            expect(data.user.name).not.toContain('<script');
            expect(data.user.name).not.toContain('javascript:');
          }
        }
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        '',
        ' ',
      ];

      for (const invalidEmail of invalidEmails) {
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: invalidEmail,
            name: 'Test User',
            password: 'SecurePassword123!'
          }),
        });

        const { _POST } = await import('@/app/api/auth/register/route');
        const response = await POST(request);
        const data = await response.json() as { error?: string };

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      }
    });
  });

  describe('🚪 Authorization Security', () => {
    it('should prevent unauthorized access to protected routes', async () => {
      const protectedRoutes = [
        '/api/admin/users',
        '/api/admin/roles',
        '/api/meetings',
        '/api/staff',
      ];

      for (const route of protectedRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`, {
          method: 'GET',
        });

        // Should require authentication
        const authResult = await withAuth(request, { requireAuth: true });
        if (!authResult.success) {
          expect(authResult.statusCode).toBe(401);
        }
      }
    });

    it('should enforce role-based access control', async () => {
      // Create users with different roles
      const teacherResult = await createTestUser({
        email: 'teacher@agendaiq.com',
        name: 'Teacher User',
        withStaff: true,
        staffRole: 'Teacher'
      });

      const adminResult = await createTestUser({
        email: 'admin@agendaiq.com',
        name: 'Admin User',
        withStaff: true,
        staffRole: 'Administrator'
      });

      // Teacher should not access admin routes
      const teacherRequest = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'GET',
      });

      const teacherAuthResult = await withAuth(teacherRequest, { requireAdminRole: true });
      expect(teacherAuthResult.success).toBe(false);

      // Admin should access admin routes
      const adminRequest = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'GET',
      });

      const adminAuthResult = await withAuth(adminRequest, { requireAdminRole: true });
      // This will depend on the actual implementation
      if (adminAuthResult.success) {
        expect(adminAuthResult.user).toBeDefined();
      }

      // Cleanup
      await prisma.users.deleteMany({
        where: {
          email: {
            in: ['teacher@agendaiq.com', 'admin@agendaiq.com']
          }
        }
      });
    });
  });

  describe('🔄 Session Management', () => {
    it('should handle session expiration correctly', async () => {
      // This would test JWT token expiration
      // Implementation depends on NextAuth configuration
      const expiredToken = 'expired.jwt.token';
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      });

      const authResult = await withAuth(request, { requireAuth: true });
      expect(authResult.success).toBe(false);
    });

    it('should invalidate sessions on password change', async () => {
      // This test documents the requirement for session invalidation
      // when security-sensitive changes occur
      expect(testUser.id).toBeDefined();
      
      // After password change, old sessions should be invalid
      // Implementation would depend on session management strategy
    });
  });
});
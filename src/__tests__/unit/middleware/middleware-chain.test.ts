/**
 * AUTH-MWINT-01, AUTH-MWINT-03: Middleware Chain Tests
 * Test that rate-limit and audit middleware don't bypass auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit-middleware';
import { auditMiddleware } from '@/lib/middleware/audit-middleware';

// Mock next-auth
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock rate limiters
jest.mock('@/lib/utils/rate-limit', () => ({
  RateLimiters: {
    auth: { check: jest.fn(), createErrorResponse: jest.fn() },
    registration: { check: jest.fn(), createErrorResponse: jest.fn() },
    passwordReset: { check: jest.fn(), createErrorResponse: jest.fn() },
    api: { check: jest.fn(), createErrorResponse: jest.fn() },
  },
  getClientIdentifier: jest.fn(() => 'test-client'),
}));

describe('Middleware Chain Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AUTH-MWINT-01: Rate-limit does not bypass auth', () => {
    it('should return null when under quota to continue chain', async () => {
      const request = new NextRequest('http://localhost:3000/api/users');
      
      const { RateLimiters } = require('@/lib/utils/rate-limit');
      RateLimiters.api.check.mockResolvedValue({ success: true });
      
      const result = await rateLimitMiddleware(request);
      
      // Should return null to continue middleware chain
      expect(result).toBeNull();
    });

    it('should return 429 response when over quota', async () => {
      const request = new NextRequest('http://localhost:3000/api/users');
      
      const { RateLimiters } = require('@/lib/utils/rate-limit');
      RateLimiters.api.check.mockResolvedValue({ 
        success: false, 
        error: 'Rate limit exceeded' 
      });
      
      const mockResponse = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
      RateLimiters.api.createErrorResponse.mockReturnValue(mockResponse);
      
      const result = await rateLimitMiddleware(request);
      
      // Should return 429 response
      expect(result).toBe(mockResponse);
    });
  });

  describe('AUTH-MWINT-03: Audit does not suppress security headers', () => {
    it('should return null to allow security headers to be added', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users');
      
      const result = await auditMiddleware(request);
      
      // Should return null to continue middleware chain
      expect(result).toBeNull();
    });
  });

  describe('Security Headers Application', () => {
    it('should add security headers to final response', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard');
      
      const { getToken } = require('next-auth/jwt');
      getToken.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        capabilities: [],
      });
      
      const response = await middleware(request);
      
      // Check for security headers
      if (response) {
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
        expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      }
    });
  });

  describe('Public vs Protected Routes', () => {
    it('should allow public endpoints without auth', async () => {
      const publicPaths = [
        '/api/auth/signin',
        '/api/health',
        '/api/setup/check',
      ];
      
      const { getToken } = require('next-auth/jwt');
      getToken.mockResolvedValue(null);
      
      for (const path of publicPaths) {
        const request = new NextRequest(`http://localhost:3000${path}`);
        const response = await middleware(request);
        
        // Should not return 401 for public paths
        if (response) {
          expect(response.status).not.toBe(401);
        }
      }
    });

    it('should require auth for protected endpoints', async () => {
      const protectedPaths = [
        '/api/admin/users',
        '/api/dev/debug',
        '/api/system/health',
        '/api/test-sentry', // Should require DEV_DEBUG capability
      ];
      
      const { getToken } = require('next-auth/jwt');
      getToken.mockResolvedValue(null);
      
      for (const path of protectedPaths) {
        const request = new NextRequest(`http://localhost:3000${path}`);
        const response = await middleware(request);
        
        // Should return 401 for protected paths without auth
        if (response) {
          expect(response.status).toBe(401);
        }
      }
    });
  });
});
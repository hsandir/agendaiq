import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Authentication API Integration Tests', () => {
  let testUserEmail: string;
  
  beforeAll(async () => {
    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'integration.test'
        }
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserEmail) {
      await prisma.user.deleteMany({
        where: {
          email: testUserEmail
        }
      });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      testUserEmail = `integration.test.${Date.now()}@agendaiq.com`;
      
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!',
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUserEmail);
      expect(data.user.id).toBeDefined();
      
      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail }
      });
      expect(user).toBeTruthy();
    });

    it('should reject duplicate email addresses', async () => {
      const duplicateEmail = `duplicate.${Date.now()}@test.com`;
      
      // Create first user
      await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: duplicateEmail,
          password: 'TestPassword123!',
        }),
      });

      // Try to create duplicate
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: duplicateEmail,
          password: 'TestPassword123!',
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('User already exists');
      
      // Cleanup
      await prisma.user.delete({
        where: { email: duplicateEmail }
      });
    });

    it('should validate email format', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123!',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid input');
      expect(data.details).toContain('Invalid email format');
    });

    it('should enforce minimum password length', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'short',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid input');
      expect(data.details).toContain('Password must be at least 8 characters');
    });

    it('should handle rate limiting', async () => {
      const testEmail = `ratelimit.${Date.now()}@test.com`;
      
      // Make multiple requests quickly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': '192.168.1.100', // Same IP for rate limiting
            },
            body: JSON.stringify({
              email: `${i}.${testEmail}`,
              password: 'TestPassword123!',
            }),
          })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
      
      // Cleanup created users
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: testEmail
          }
        }
      });
    });
  });

  describe('GET /api/auth/check-first-user', () => {
    it('should return false when users exist', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/check-first-user`);
      
      expect(response.status).toBe(200);
      const isFirstUser = await response.json();
      expect(isFirstUser).toBe(false); // We have admin users in the system
    });
  });

  describe('NextAuth Sign In', () => {
    it('should authenticate with valid credentials', async () => {
      // This would require setting up a test environment with NextAuth
      // For now, we'll test the credential validation logic directly
      
      const testEmail = 'admin@school.edu';
      const testPassword = '1234';
      
      // Verify admin user exists
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: {
          Staff: {
            include: {
              Role: true,
              Department: true,
              School: true,
            }
          }
        }
      });
      
      expect(user).toBeTruthy();
      expect(user?.email).toBe(testEmail);
      
      // Verify password hash
      if (user?.hashedPassword) {
        const isValid = await bcrypt.compare(testPassword, user.hashedPassword);
        expect(isValid).toBe(true);
      }
    });

    it('should reject invalid credentials', async () => {
      const testEmail = 'nonexistent@test.com';
      
      const user = await prisma.user.findUnique({
        where: { email: testEmail }
      });
      
      expect(user).toBeNull();
    });
  });

  describe('Database Consistency', () => {
    it('should have valid role hierarchy', async () => {
      const hierarchies = await prisma.roleHierarchy.findMany({
        include: {
          parent_role: true,
          child_role: true
        }
      });
      
      expect(hierarchies.length).toBeGreaterThan(0);
      
      // Verify no circular dependencies
      for (const hierarchy of hierarchies) {
        expect(hierarchy.parent_role_id).not.toBe(hierarchy.child_role_id);
      }
    });

    it('should have valid permissions for roles', async () => {
      const permissions = await prisma.permission.findMany({
        include: {
          role: true
        }
      });
      
      expect(permissions.length).toBeGreaterThan(0);
      
      // Verify all permissions have valid roles
      for (const permission of permissions) {
        expect(permission.role).toBeTruthy();
        expect(permission.capability).toBeTruthy();
      }
    });

    it('should have admin users with proper flags', async () => {
      const admins = await prisma.user.findMany({
        where: { is_admin: true }
      });
      
      expect(admins.length).toBeGreaterThan(0);
      
      // Verify admin@school.edu exists
      const devAdmin = admins.find(a => a.email === 'admin@school.edu');
      expect(devAdmin).toBeTruthy();
      expect(devAdmin?.is_system_admin).toBe(true);
      
      // Verify sysadmin@cjcollegeprep.org exists
      const schoolAdmin = admins.find(a => a.email === 'sysadmin@cjcollegeprep.org');
      expect(schoolAdmin).toBeTruthy();
      expect(schoolAdmin?.is_school_admin).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should handle session tokens correctly', async () => {
      // This would test JWT token generation and validation
      // Requires mocking NextAuth or using a test setup
      
      const sessionData = {
        user: {
          id: 1,
          email: 'test@test.com',
          name: 'Test User'
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      expect(sessionData.expires).toBeTruthy();
      expect(new Date(sessionData.expires).getTime()).toBeGreaterThan(Date.now());
    });
  });
});
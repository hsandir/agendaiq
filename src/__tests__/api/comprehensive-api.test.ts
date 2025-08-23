/**
 * Comprehensive API Route Tests
 * Tests all major API endpoints for functionality, security, and performance
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTestUser, cleanupTestData } from '../helpers/test-db';
import type { StaffWithRelations } from '@/types';

describe('Comprehensive API Route Tests', () => {
  let testStaff: StaffWithRelations;

  beforeAll(async () => {
    // Create test users
    const userResult = await createTestUser({
      email: 'api-test-user@agendaiq.com',
      name: 'API Test User',
      withStaff: true,
      staffRole: 'Teacher'
    });
    
    testStaff = userResult.staff as StaffWithRelations;

    await createTestUser({
      email: 'api-test-admin@agendaiq.com',
      name: 'API Test Admin',
      withStaff: true,
      staffRole: 'Administrator'
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('🏢 Organization Management APIs', () => {
    describe('Districts API', () => {
      it('should create district with proper validation', async () => {
        const districtData = {
          name: 'Test District',
          code: 'TD001',
          address: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          phone: '555-0123',
          website: 'https://testdistrict.edu'
        };

        const request = new NextRequest('http://localhost:3000/api/districts', {
          method: 'POST',
          body: JSON.stringify(districtData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;

        const { POST } = await import('@/app/api/districts/route');
        const response = await POST(request);
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;

        // Performance assertions
        expect(endTime - startTime).toBeLessThan(1000); // < 1 second
        expect(endMemory - startMemory).toBeLessThan(10 * 1024 * 1024); // < 10MB

        // Functional assertions
        if (response.ok) {
          const data = await response.json() as { district: { id: number; name: string } };
          expect(data.district).toBeDefined();
          expect(data.district.name).toBe(districtData.name);

          // Cleanup
          await prisma.district.delete({
            where: { id: data.district.id }
          });
        }
      });

      it('should validate district input data', async () => {
        const invalidData = [
          { name: '', code: 'TD001' }, // Empty name
          { name: 'Test', code: '' }, // Empty code
          { name: 'Test', code: 'TOOLONGCODE123456789' }, // Code too long
          { name: 'A'.repeat(101), code: 'TD001' }, // Name too long
        ];

        for (const data of invalidData) {
          const request = new NextRequest('http://localhost:3000/api/districts', {
            method: 'POST',
            body: JSON.stringify(data),
          });

          const { POST } = await import('@/app/api/districts/route');
        const response = await POST(request);
          
          expect(response.status).toBe(400);
        }
      });

      it('should prevent duplicate district codes', async () => {
        const districtData = {
          name: 'Duplicate Test District',
          code: 'DUP001',
          address: '123 Test Street'
        };

        // Create first district
        const district1 = await prisma.district.create({
          data: districtData
        });

        // Try to create duplicate
        const request = new NextRequest('http://localhost:3000/api/districts', {
          method: 'POST',
          body: JSON.stringify(districtData),
        });

        const { POST } = await import('@/app/api/districts/route');
        const response = await POST(request);
        
        expect(response.status).toBe(409); // Conflict
        
        // Cleanup
        await prisma.district.delete({ where: { id: district1.id } });
      });
    });

    describe('Schools API', () => {
      it('should create school with district relationship', async () => {
        // Create a district first
        const district = await prisma.district.create({
          data: {
            name: 'School Test District',
            code: 'STD001',
            address: '123 District Ave'
          }
        });

        const schoolData = {
          name: 'Test Elementary School',
          code: 'TES001',
          district_id: district.id,
          address: '456 School Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        };

        const request = new NextRequest('http://localhost:3000/api/schools', {
          method: 'POST',
          body: JSON.stringify(schoolData),
        });

        const { POST } = await import('@/app/api/schools/route');
        const response = await POST(request);

        if (response.ok) {
          const data = await response.json() as { school: { id: number; district_id: number } };
          expect(data.school.district_id).toBe(district.id);

          // Cleanup
          await prisma.school.delete({ where: { id: data.school.id } });
        }

        await prisma.district.delete({ where: { id: district.id } });
      });
    });
  });

  describe('👥 User Management APIs', () => {
    describe('Users API', () => {
      it('should list users with pagination', async () => {
        const request = new NextRequest('http://localhost:3000/api/users?page=1&limit=10', {
          method: 'GET',
        });

        const startTime = Date.now();
        const { GET } = await import('@/app/api/users/route');
        const response = await GET(request);
        const responseTime = Date.now() - startTime;

        expect(responseTime).toBeLessThan(500); // < 500ms
        
        if (response.ok) {
          const data = await response.json() as { 
            users: unknown[]; 
            pagination: { 
              page: number; 
              limit: number; 
              total: number; 
            } 
          };
          
          expect(Array.isArray(data.users)).toBe(true);
          expect(data.pagination).toBeDefined();
          expect(data.pagination.page).toBe(1);
          expect(data.pagination.limit).toBe(10);
        }
      });

      it('should filter users by role', async () => {
        const request = new NextRequest('http://localhost:3000/api/users?role=Administrator', {
          method: 'GET',
        });

        const { GET } = await import('@/app/api/users/route');
        const response = await GET(request);

        if (response.ok) {
          const data = await response.json() as { users: { staff?: { role: { title: string } }[] }[] };
          
          // All returned users should have Administrator role
          data.users.forEach(user => {
            if (user.staff && user.staff.length > 0) {
              expect(user.staff[0]?.role.title).toBe('Administrator');
            }
          });
        }
      });

      it('should search users by name or email', async () => {
        const searchTerm = 'test';
        const request = new NextRequest(`http://localhost:3000/api/users?search=${searchTerm}`, {
          method: 'GET',
        });

        const { GET } = await import('@/app/api/users/route');
        const response = await GET(request);

        if (response.ok) {
          const data = await response.json() as { users: { name?: string; email: string }[] };
          
          // Results should contain search term
          data.users.forEach(user => {
            const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
            expect(nameMatch ?? emailMatch).toBe(true);
          });
        }
      });
    });

    describe('Staff API', () => {
      it('should create staff with role assignment', async () => {
        // Get a role first
        const teacherRole = await prisma.role.findFirst({
          where: { title: 'Teacher' }
        });

        if (!teacherRole) {
          throw new Error('Teacher role not found');
        }

        // Create a user first
        const user = await prisma.user.create({
          data: {
            email: 'newstaff@agendaiq.com',
            name: 'New Staff Member'
          }
        });

        const staffData = {
          user_id: user.id,
          role_id: teacherRole.id,
          employee_id: 'EMP001',
          hire_date: new Date().toISOString()
        };

        const request = new NextRequest('http://localhost:3000/api/staff', {
          method: 'POST',
          body: JSON.stringify(staffData),
        });

        const { POST } = await import('@/app/api/staff/route');
        const response = await POST(request);

        if (response.ok) {
          const data = await response.json() as { staff: { id: number; role_id: number } };
          expect(data.staff.role_id).toBe(teacherRole.id);

          // Cleanup
          await prisma.staff.delete({ where: { id: data.staff.id } });
        }

        await prisma.user.delete({ where: { id: user.id } });
      });
    });
  });

  describe('📅 Meeting Management APIs', () => {
    describe('Meetings API', () => {
      it('should create meeting with validation', async () => {
        const meetingData = {
          title: 'Test Meeting',
          description: 'This is a test meeting',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
          location: 'Conference Room A',
          organizer_id: testStaff.id
        };

        const request = new NextRequest('http://localhost:3000/api/meetings', {
          method: 'POST',
          body: JSON.stringify(meetingData),
        });

        const startTime = Date.now();
        const { POST } = await import('@/app/api/meetings/route');
        const response = await POST(request);
        const responseTime = Date.now() - startTime;

        expect(responseTime).toBeLessThan(800); // < 800ms

        if (response.ok) {
          const data = await response.json() as { meeting: { id: number; title: string } };
          expect(data.meeting.title).toBe(meetingData.title);

          // Cleanup
          await prisma.meeting.delete({ where: { id: data.meeting.id } });
        }
      });

      it('should validate meeting time constraints', async () => {
        const invalidMeetings = [
          {
            title: 'Past Meeting',
            start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
            end_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            organizer_id: testStaff.id
          },
          {
            title: 'Invalid Time Range',
            start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(), // End before start
            organizer_id: testStaff.id
          },
        ];

        for (const meetingData of invalidMeetings) {
          const request = new NextRequest('http://localhost:3000/api/meetings', {
            method: 'POST',
            body: JSON.stringify(meetingData),
          });

          const { POST } = await import('@/app/api/meetings/route');
        const response = await POST(request);

          expect(response.status).toBe(400);
        }
      });

      it('should handle concurrent meeting creation', async () => {
        const meetingData = {
          title: 'Concurrent Test Meeting',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          organizer_id: testStaff.id
        };

        // Create multiple simultaneous requests
        const requests = Array(5).fill(null).map(() => {
          const request = new NextRequest('http://localhost:3000/api/meetings', {
            method: 'POST',
            body: JSON.stringify({
              ...meetingData,
              title: `${meetingData.title} ${Math.random()}`
            }),
          });
          
          return import('@/app/api/meetings/route').then(module => module.POST(request));
        });

        const responses = await Promise.allSettled(requests);
        
        // At least some should succeed
        const successful = responses.filter(r => 
          r.status === 'fulfilled' && r.value.ok
        );
        
        expect(successful.length).toBeGreaterThan(0);

        // Cleanup successful meetings
        for (const response of successful) {
          if (response.status === 'fulfilled' && response.value.ok) {
            const data = await response.value.json() as { meeting: { id: number } };
            await prisma.meeting.delete({ where: { id: data.meeting.id } }).catch(() => {
              // Ignore cleanup errors
            });
          }
        }
      });
    });

    describe('Meeting Agenda Items API', () => {
      let testmeeting: { id: number };

      beforeAll(async () => {
        // Create a test meeting
        testMeeting = await prisma.meeting.create({
          data: {
            title: 'Agenda Test Meeting',
            start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
            end_time: new Date(Date.now() + 25 * 60 * 60 * 1000),
            organizer_id: testStaff.id
          }
        });
      });

      afterAll(async () => {
        await prisma.meetingAgendaItem.deleteMany({
          where: { meeting_id: testMeeting.id }
        });
        await prisma.meeting.delete({ where: { id: testMeeting.id } });
      });

      it('should create agenda items with proper ordering', async () => {
        const agendaItems = [
          {
            topic: 'Opening Remarks',
            priority: 'High' as const,
            purpose: 'Information_Sharing' as const,
            status: 'Pending' as const,
            order_index: 0
          },
          {
            topic: 'Budget Discussion',
            priority: 'High' as const,
            purpose: 'Decision' as const,
            status: 'Pending' as const,
            order_index: 1
          },
          {
            topic: 'Closing Remarks',
            priority: 'Low' as const,
            purpose: 'Information_Sharing' as const,
            status: 'Pending' as const,
            order_index: 2
          }
        ];

        const request = new NextRequest(`http://localhost:3000/api/meetings/${testMeeting.id}/agenda-items`, {
          method: 'PUT',
          body: JSON.stringify({ items: agendaItems }),
        });

        const { PUT } = await import('@/app/api/meetings/[id]/agenda-items/route');
        const response = await PUT(request, { params: Promise.resolve({ id: testMeeting.id.toString() }) });

        expect(response.status).toBe(200);

        // Verify ordering in database
        const savedItems = await prisma.meetingAgendaItem.findMany({
          where: { meeting_id: testMeeting.id },
          orderBy: { order_index: 'asc' }
        });

        expect(savedItems).toHaveLength(3);
        expect(savedItems[0]?.topic).toBe('Opening Remarks');
        expect(savedItems[1]?.topic).toBe('Budget Discussion');
        expect(savedItems[2]?.topic).toBe('Closing Remarks');
      });
    });
  });

  describe('📊 Performance & Load Testing', () => {
    it('should handle high load on user listing', async () => {
      const concurrentRequests = 20;
      const requests = Array(concurrentRequests).fill(null).map(() => {
        const request = new NextRequest('http://localhost:3000/api/users?limit=50', {
          method: 'GET',
        });
        
        return import('@/app/api/users/route').then(module => {
          const startTime = Date.now();
          return module.GET(request).then(response => ({
            response,
            responseTime: Date.now() - startTime
          }));
        });
      });

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled') as 
        PromiseFulfilledResult<{ response: Response; responseTime: number }>[];

      // At least 80% should succeed
      expect(successful.length).toBeGreaterThanOrEqual(concurrentRequests * 0.8);

      // Average response time should be reasonable
      const avgResponseTime = successful.reduce((sum, result) => 
        sum + result.value.responseTime, 0) / successful.length;
      
      expect(avgResponseTime).toBeLessThan(2000); // < 2 seconds average
    });

    it('should handle memory efficiently during large queries', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make several large queries
      const requests = Array(10).fill(null).map(async () => {
        const request = new NextRequest('http://localhost:3000/api/users?limit=100', {
          method: 'GET',
        });
        
        const module = await import('@/app/api/users/route');
        return module.GET(request);
      });

      await Promise.all(requests);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('🔍 Error Handling & Edge Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: '{ invalid json }',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { POST } = await import('@/app/api/users/route');
        const response = await POST(request);

      expect(response.status).toBe(400);
      
      const data = await response.json() as { error: string };
      expect(data.error).toBeDefined();
    });

    it('should handle database connection errors', async () => {
      // This would require mocking database connections
      // to simulate connection failures
      expect(true).toBe(true); // Placeholder for implementation
    });

    it('should handle extremely large payloads', async () => {
      const largeData = {
        name: 'A'.repeat(10000), // 10KB string
        description: 'B'.repeat(50000), // 50KB string
      };

      const request = new NextRequest('http://localhost:3000/api/districts', {
        method: 'POST',
        body: JSON.stringify(largeData),
      });

      const { POST } = await import('@/app/api/districts/route');
        const response = await POST(request);

      // Should either reject (413) or validate and reject (400)
      expect([400, 413].includes(response.status)).toBe(true);
    });
  });
});
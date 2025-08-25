/**
 * Integration test for meeting creation with repeat functionality
 */

import { getTestPrismaClient, createTestContext } from '../helpers/test-db';
import type { TestContext } from '../types/test-context';

const prisma = getTestPrismaClient();

describe('Meeting Creation Integration', () => {
  let testContext: TestContext;

  beforeAll(async () => {
    testContext = await createTestContext();
  });

  beforeEach(async () => {
    // Clean up test data using real database
    await prisma.meetingAttendee.deleteMany();
    await prisma.meetingAgendaItem.deleteMany();
    await prisma.meeting_action_items.deleteMany();
    await prisma.meeting.deleteMany();
  });

  afterAll(async () => {
    if (testContext?.cleanup) {
      await testContext.cleanup();
    }
    await prisma.$disconnect();
  });

  describe('Single Meeting Creation', () => {
    it('should create a single meeting without repeat', async () => {
      // Use real staff data from test context
      const staff = testContext.adminStaff;
      
      const meeting = await prisma.meeting.create({
        data: {
          title: 'Test Meeting',
          description: 'Test Description',
          start_time: new Date('2024-01-15T10:00:00'),
          end_time: new Date('2024-01-15T11:00:00'),
          meeting_type: 'regular',
          status: 'draft',
          organizer_id: staff.id,
          department_id: staff.department_id,
          school_id: staff.school_id,
          district_id: staff.district_id,
        }
      });

      expect(meeting).toBeDefined();
      expect(meeting.title).toBe('Test Meeting');
      expect(meeting.id).toBeDefined();
      expect(meeting.organizer_id).toBe(staff.id);
    });
  });

  describe('Repeat Meeting Creation', () => {
    it('should create meeting series with repeat configuration', async () => {
      const staff = testContext.adminStaff;
      const seriesId = `series_test_${Date.now()}`;
      const meetings = [];

      // Create 3 meetings in a series
      for (let i = 0; i < 3; i++) {
        const startDate = new Date('2024-01-15T10:00:00');
        startDate.setDate(startDate.getDate() + (i * 7)); // Weekly

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
        
        const meeting = await prisma.meeting.create({
          data: {
            title: `Weekly Meeting (${i + 1}/3)`,
            description: 'Recurring weekly meeting',
            start_time: startDate,
            end_time: endDate,
            meeting_type: 'regular',
            status: 'draft',
            organizer_id: staff.id,
            department_id: staff.department_id,
            school_id: staff.school_id,
            district_id: staff.district_id,
            // Repeat fields
            repeat_type: 'weekly',
            repeat_pattern: 'weekly',
            repeat_interval: 1,
            repeat_weekdays: [1], // Monday
            repeat_end_type: 'after',
            repeat_occurrences: 3,
            series_id: seriesId,
            series_position: i + 1,
            is_series_master: i === 0,
          }
        });

        meetings.push(meeting);
      }

      expect(meetings).toHaveLength(3);
      expect(meetings[0].is_series_master).toBe(true);
      expect(meetings[1].is_series_master).toBe(false);
      expect(meetings[2].is_series_master).toBe(false);
      
      // All should have same series ID
      const uniqueSeriesIds = new Set(meetings.map(m => m.series_id));
      expect(uniqueSeriesIds.size).toBe(1);
      expect(uniqueSeriesIds.has(seriesId)).toBe(true);

      // Check series positions
      expect(meetings[0].series_position).toBe(1);
      expect(meetings[1].series_position).toBe(2);
      expect(meetings[2].series_position).toBe(3);
    });

    it('should handle monthly repeat patterns', async () => {
      const staff = testContext.adminStaff;

      const meeting = await prisma.meeting.create({
        data: {
          title: 'Monthly Meeting',
          description: 'First Tuesday of every month',
          start_time: new Date('2024-01-02T14:00:00'), // First Tuesday
          end_time: new Date('2024-01-02T15:00:00'),
          meeting_type: 'regular',
          status: 'draft',
          organizer_id: staff.id,
          department_id: staff.department_id,
          school_id: staff.school_id,
          district_id: staff.district_id,
          // Monthly repeat config
          repeat_type: 'monthly',
          repeat_pattern: 'monthly',
          repeat_month_week: 1, // First
          repeat_month_weekday: 2, // Tuesday
          repeat_end_type: 'never',
          series_id: `series_monthly_${Date.now()}`,
          series_position: 1,
          is_series_master: true,
        }
      });

      expect(meeting.repeat_pattern).toBe('monthly');
      expect(meeting.repeat_month_week).toBe(1);
      expect(meeting.repeat_month_weekday).toBe(2);
      expect(meeting.repeat_end_type).toBe('never');
    });

    it('should store exception dates', async () => {
      const staff = testContext.adminStaff;

      const exceptions = [
        new Date('2024-01-22T10:00:00'), // Skip this date
        new Date('2024-02-05T10:00:00'), // Skip this date
      ];

      const meeting = await prisma.meeting.create({
        data: {
          title: 'Weekly with Exceptions',
          start_time: new Date('2024-01-15T10:00:00'),
          end_time: new Date('2024-01-15T11:00:00'),
          meeting_type: 'regular',
          status: 'draft',
          organizer_id: staff.id,
          department_id: staff.department_id,
          school_id: staff.school_id,
          district_id: staff.district_id,
          repeat_type: 'weekly',
          repeat_pattern: 'weekly',
          repeat_exceptions: exceptions,
          series_id: `series_except_${Date.now()}`,
          series_position: 1,
          is_series_master: true,
        }
      });

      expect(meeting.repeat_exceptions).toHaveLength(2);
      expect(meeting.repeat_exceptions[0]).toEqual(exceptions[0]);
      expect(meeting.repeat_exceptions[1]).toEqual(exceptions[1]);
    });
  });

  describe('Meeting with Attendees', () => {
    it('should create meeting with attendees', async () => {
      const organizer = testContext.adminStaff;
      const attendee = testContext.teacherStaff;

      const meeting = await prisma.meeting.create({
        data: {
          title: 'Meeting with Attendees',
          start_time: new Date('2024-01-15T10:00:00'),
          end_time: new Date('2024-01-15T11:00:00'),
          meeting_type: 'regular',
          status: 'draft',
          organizer_id: organizer.id,
          department_id: organizer.department_id,
          school_id: organizer.school_id,
          district_id: organizer.district_id,
          meeting_attendee: {
            create: [{
              staff_id: attendee.id,
              status: 'pending',
            }]
          }
        },
        include: {
          meeting_attendee: true
        }
      });

      expect(meeting.meeting_attendee).toHaveLength(1);
      expect(meeting.meeting_attendee[0].status).toBe('pending');
      expect(meeting.meeting_attendee[0].staff_id).toBe(attendee.id);
    });
  });
});
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/meetings/route'
import { PATCH } from '@/app/api/meetings/[id]/route'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/api-auth'
import { createMockNextRequest, createTestUser, createTestStaff, createTestMeeting } from '@/__tests__/utils/test-utils'

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    meeting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    meetingAttendee: {
      createMany: jest.fn(),
    },
    meetingAuditLog: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/api-auth', () => ({
  withAuth: jest.fn(),
}))

jest.mock('@/lib/utils/rate-limit', () => ({
  RateLimiters: {
    meetings: {
      check: jest.fn().mockResolvedValue({ success: true }),
      createErrorResponse: jest.fn(),
    },
  },
  getClientIdentifier: jest.fn().mockReturnValue('test-client'),
}))

describe('Meetings API', () => {
  const mockUser = createTestUser()
  const mockStaff = createTestStaff()
  const mockMeeting = createTestMeeting()

  beforeEach(() => {
    jest.clearAllMocks()
    // Default auth success
    ;(withAuth as jest.Mock).mockResolvedValue({
      success: true,
      user: {
        ...mockUser,
        staff: {
          ...mockStaff,
          role: { title: 'Teacher', is_leadership: false, priority: 6 },
          department: { id: 1, name: 'Mathematics' },
          school: { id: 1, name: 'Test School' },
          district: { id: 1, name: 'Test District' },
        },
      },
    })
  })

  describe('GET /api/meetings', () => {
    it('returns meetings for authenticated user', async () => {
      const mockMeetings = [mockMeeting]
      ;(prisma.meeting.findMany as jest.Mock).mockResolvedValue(mockMeetings)

      const request = createMockNextRequest('GET')
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('meetings')
      expect(prisma.meeting.findMany).toHaveBeenCalled()
    })

    it('requires staff authentication', async () => {
      ;(withAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Authentication required',
        statusCode: 401,
      })

      const request = createMockNextRequest('GET')
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Authentication required' })
    })

    it('filters meetings based on user role', async () => {
      // Test as admin
      ;(withAuth as jest.Mock).mockResolvedValue({
        success: true,
        user: {
          ...mockUser,
          staff: {
            ...mockStaff,
            role: { title: 'Administrator', is_leadership: true, priority: 1 },
            department: { id: 1, name: 'Administration' },
            school: { id: 1, name: 'Test School' },
            district: { id: 1, name: 'Test District' },
          },
        },
      })

      const request = createMockNextRequest('GET')
      await GET(request as NextRequest)

      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            Staff: expect.objectContaining({
              school_id: 1,
            }),
          }),
        })
      )
    })

    it('returns only meetings user is authorized to see', async () => {
      // Test as regular staff
      const staffMeetings = [
        { ...mockMeeting, organizer_id: 1 }, // Own meeting
        { ...mockMeeting, id: 2, organizer_id: 2 }, // Not authorized
      ]
      ;(prisma.meeting.findMany as jest.Mock).mockResolvedValue([staffMeetings[0]])

      const request = createMockNextRequest('GET')
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.meetings).toHaveLength(1)
      expect(data.meetings[0].id).toBe(1)
    })
  })

  describe('POST /api/meetings', () => {
    const validMeetingData = {
      title: 'Test Meeting',
      description: 'Test Description',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      attendeeIds: [2, 3],
    }

    it('creates meeting with valid data', async () => {
      const createdMeeting = { ...mockMeeting, ...validMeetingData }
      ;(prisma.meeting.create as jest.Mock).mockResolvedValue(createdMeeting)
      ;(prisma.meeting.findUnique as jest.Mock).mockResolvedValue({
        ...createdMeeting,
        Staff: mockStaff,
        MeetingAttendee: [],
      })

      const request = createMockNextRequest('POST', validMeetingData)
      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('meeting')
      expect(prisma.meeting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: validMeetingData.title,
            description: validMeetingData.description,
          }),
        })
      )
    })

    it('validates required fields', async () => {
      const invalidData = { title: '' } // Missing required fields

      const request = createMockNextRequest('POST', invalidData)
      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid input')
      expect(data).toHaveProperty('details')
    })

    it('validates date logic', async () => {
      const invalidDates = {
        ...validMeetingData,
        startTime: new Date(Date.now() + 7200000).toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(), // End before start
      }

      const request = createMockNextRequest('POST', invalidDates)
      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'End time must be after start time')
    })

    it('enforces rate limiting', async () => {
      const { RateLimiters } = require('@/lib/utils/rate-limit')
      RateLimiters.meetings.check.mockResolvedValue({ success: false })
      RateLimiters.meetings.createErrorResponse.mockReturnValue(
        new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
      )

      const request = createMockNextRequest('POST', validMeetingData)
      const response = await POST(request as NextRequest)

      expect(response.status).toBe(429)
    })

    it('creates audit log entry', async () => {
      const createdMeeting = { ...mockMeeting, id: 123 }
      ;(prisma.meeting.create as jest.Mock).mockResolvedValue(createdMeeting)
      ;(prisma.meeting.findUnique as jest.Mock).mockResolvedValue({
        ...createdMeeting,
        Staff: mockStaff,
        MeetingAttendee: [],
      })

      const request = createMockNextRequest('POST', validMeetingData)
      await POST(request as NextRequest)

      expect(prisma.meetingAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            meeting_id: 123,
            action: 'CREATE',
            user_id: mockUser.id,
          }),
        })
      )
    })

    it('adds attendees when provided', async () => {
      const createdMeeting = { ...mockMeeting }
      ;(prisma.meeting.create as jest.Mock).mockResolvedValue(createdMeeting)
      ;(prisma.meeting.findUnique as jest.Mock).mockResolvedValue({
        ...createdMeeting,
        Staff: mockStaff,
        MeetingAttendee: [],
      })

      const request = createMockNextRequest('POST', validMeetingData)
      await POST(request as NextRequest)

      expect(prisma.meetingAttendee.createMany).toHaveBeenCalledWith({
        data: [
          { meeting_id: createdMeeting.id, staff_id: 2, status: 'PENDING' },
          { meeting_id: createdMeeting.id, staff_id: 3, status: 'PENDING' },
        ],
      })
    })
  })

  describe('PATCH /api/meetings/[id]', () => {
    const updateData = {
      title: 'Updated Meeting Title',
      status: 'CANCELLED',
    }

    it('updates meeting as organizer', async () => {
      const existingMeeting = { ...mockMeeting, organizer_id: 1 }
      ;(prisma.meeting.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingMeeting) // For permission check
        .mockResolvedValueOnce({ ...existingMeeting, ...updateData }) // Updated meeting

      ;(prisma.meeting.update as jest.Mock).mockResolvedValue({
        ...existingMeeting,
        ...updateData,
      })

      const request = createMockNextRequest('PATCH', updateData)
      const response = await PATCH(request as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(prisma.meeting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            title: updateData.title,
            status: updateData.status,
          }),
        })
      )
    })

    it('prevents unauthorized updates', async () => {
      const existingMeeting = { ...mockMeeting, organizer_id: 99 } // Different organizer
      ;(prisma.meeting.findUnique as jest.Mock).mockResolvedValue(existingMeeting)

      const request = createMockNextRequest('PATCH', updateData)
      const response = await PATCH(request as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error', 'Not authorized to edit this meeting')
    })

    it('allows admin to update any meeting', async () => {
      ;(withAuth as jest.Mock).mockResolvedValue({
        success: true,
        user: {
          ...mockUser,
          staff: {
            ...mockStaff,
            role: { title: 'Administrator', is_leadership: true, priority: 1 },
          },
        },
      })

      const existingMeeting = { ...mockMeeting, organizer_id: 99 }
      ;(prisma.meeting.findUnique as jest.Mock).mockResolvedValue(existingMeeting)
      ;(prisma.meeting.update as jest.Mock).mockResolvedValue({
        ...existingMeeting,
        ...updateData,
      })

      const request = createMockNextRequest('PATCH', updateData)
      const response = await PATCH(request as NextRequest, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(200)
      expect(prisma.meeting.update).toHaveBeenCalled()
    })

    it('validates update data', async () => {
      const invalidUpdate = { title: '' } // Empty title

      const existingMeeting = { ...mockMeeting, organizer_id: 1 }
      ;(prisma.meeting.findUnique as jest.Mock).mockResolvedValue(existingMeeting)

      const request = createMockNextRequest('PATCH', invalidUpdate)
      const response = await PATCH(request as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid input')
    })

    it('creates audit log for updates', async () => {
      const existingMeeting = { ...mockMeeting, organizer_id: 1 }
      const updatedMeeting = { ...existingMeeting, ...updateData }
      
      ;(prisma.meeting.findUnique as jest.Mock).mockResolvedValue(existingMeeting)
      ;(prisma.meeting.update as jest.Mock).mockResolvedValue(updatedMeeting)

      const request = createMockNextRequest('PATCH', updateData)
      await PATCH(request as NextRequest, { params: Promise.resolve({ id: '1' }) })

      expect(prisma.meetingAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            meeting_id: 1,
            action: 'UPDATE',
            changes: expect.objectContaining({
              old_values: expect.any(Object),
              new_values: expect.any(Object),
            }),
          }),
        })
      )
    })

    it('handles meeting not found', async () => {
      ;(prisma.meeting.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockNextRequest('PATCH', updateData)
      const response = await PATCH(request as NextRequest, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toHaveProperty('error', 'Meeting not found')
    })
  })
})
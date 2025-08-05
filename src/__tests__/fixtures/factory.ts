import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export class TestFactory {
  constructor(private prisma: PrismaClient) {}

  // User factory
  async createUser(overrides: Partial<any> = {}) {
    const password = overrides.password || 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    return this.prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        password: hashedPassword,
        emailVerified: true,
        is_active: true,
        two_factor_enabled: false,
        preferences: {},
        ...overrides,
      },
    })
  }

  // Staff factory
  async createStaff(overrides: Partial<any> = {}) {
    const user = overrides.user || await this.createUser()
    const role = overrides.role || await this.getOrCreateRole('Teacher')
    const department = overrides.department || await this.getOrCreateDepartment()
    const school = overrides.school || department.school
    const district = overrides.district || school.district

    return this.prisma.staff.create({
      data: {
        user_id: user.id,
        role_id: role.id,
        department_id: department.id,
        school_id: school.id,
        district_id: district.id,
        employee_number: faker.string.alphanumeric(8).toUpperCase(),
        hire_date: faker.date.past({ years: 5 }),
        phone: faker.phone.number(),
        office_location: faker.location.streetAddress(),
        is_active: true,
        is_on_leave: false,
        subjects: [faker.word.noun()],
        bio: faker.lorem.paragraph(),
        specializations: [faker.word.adjective()],
        ...overrides,
      },
      include: {
        User: true,
        Role: true,
        Department: true,
        School: true,
        District: true,
      },
    })
  }

  // Meeting factory
  async createMeeting(overrides: Partial<any> = {}) {
    const organizer = overrides.organizer || await this.createStaff()
    const startTime = overrides.start_time || faker.date.future()
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour later

    return this.prisma.meeting.create({
      data: {
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        start_time: startTime,
        end_time: endTime,
        organizer_id: organizer.id,
        department_id: organizer.department_id,
        school_id: organizer.school_id,
        district_id: organizer.district_id,
        status: 'SCHEDULED',
        location: faker.location.streetAddress(),
        meeting_type: 'REGULAR',
        is_recurring: false,
        is_public: true,
        allow_guests: false,
        record_meeting: false,
        send_reminders: true,
        reminder_minutes: 15,
        ...overrides,
      },
      include: {
        Staff: {
          include: {
            User: true,
            Role: true,
          },
        },
        MeetingAttendee: {
          include: {
            Staff: {
              include: {
                User: true,
              },
            },
          },
        },
        MeetingAgendaItems: true,
      },
    })
  }

  // Meeting with attendees
  async createMeetingWithAttendees(attendeeCount: number = 3, overrides: Partial<any> = {}) {
    const meeting = await this.createMeeting(overrides)
    const attendees = []

    for (let i = 0; i < attendeeCount; i++) {
      const staff = await this.createStaff()
      const attendee = await this.prisma.meetingAttendee.create({
        data: {
          meeting_id: meeting.id,
          staff_id: staff.id,
          status: faker.helpers.arrayElement(['PENDING', 'ACCEPTED', 'DECLINED']),
          response_date: faker.date.recent(),
        },
        include: {
          Staff: {
            include: {
              User: true,
              Role: true,
            },
          },
        },
      })
      attendees.push(attendee)
    }

    return { meeting, attendees }
  }

  // Agenda item factory
  async createAgendaItem(meeting: any, overrides: Partial<any> = {}) {
    const presenter = overrides.presenter || await this.createStaff()

    return this.prisma.meetingAgendaItems.create({
      data: {
        meeting_id: meeting.id,
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        presenter_id: presenter.id,
        duration_minutes: faker.number.int({ min: 5, max: 30 }),
        order_index: overrides.order_index || faker.number.int({ min: 1, max: 10 }),
        item_type: faker.helpers.arrayElement(['DISCUSSION', 'PRESENTATION', 'DECISION', 'INFORMATION']),
        status: 'PENDING',
        ...overrides,
      },
    })
  }

  // Helper methods
  private async getOrCreateRole(title: string = 'Teacher') {
    let role = await this.prisma.role.findFirst({ where: { title } })
    
    if (!role) {
      role = await this.prisma.role.create({
        data: {
          title,
          is_leadership: ['Administrator', 'Principal', 'Vice Principal'].includes(title),
          priority: this.getRolePriority(title),
        },
      })
    }
    
    return role
  }

  private async getOrCreateDepartment() {
    let department = await this.prisma.department.findFirst()
    
    if (!department) {
      const school = await this.getOrCreateSchool()
      department = await this.prisma.department.create({
        data: {
          name: faker.commerce.department(),
          code: faker.string.alphanumeric(6).toUpperCase(),
          school_id: school.id,
          description: faker.lorem.sentence(),
          is_active: true,
        },
        include: {
          School: {
            include: {
              District: true,
            },
          },
        },
      })
    }
    
    return department
  }

  private async getOrCreateSchool() {
    let school = await this.prisma.school.findFirst()
    
    if (!school) {
      const district = await this.getOrCreateDistrict()
      school = await this.prisma.school.create({
        data: {
          name: faker.company.name() + ' School',
          code: faker.string.alphanumeric(6).toUpperCase(),
          district_id: district.id,
          address: faker.location.streetAddress(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          principal_name: faker.person.fullName(),
          vice_principal_name: faker.person.fullName(),
          is_active: true,
        },
        include: {
          District: true,
        },
      })
    }
    
    return school
  }

  private async getOrCreateDistrict() {
    let district = await this.prisma.district.findFirst()
    
    if (!district) {
      district = await this.prisma.district.create({
        data: {
          name: faker.location.county() + ' District',
          code: faker.string.alphanumeric(6).toUpperCase(),
          address: faker.location.streetAddress(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          is_active: true,
        },
      })
    }
    
    return district
  }

  private getRolePriority(title: string): number {
    const priorities: Record<string, number> = {
      'Administrator': 1,
      'Superintendent': 2,
      'Principal': 3,
      'Vice Principal': 4,
      'Department Head': 5,
      'Teacher': 6,
      'Staff': 7,
    }
    return priorities[title] || 10
  }

  // Bulk creation methods
  async createUsers(count: number) {
    const users = []
    for (let i = 0; i < count; i++) {
      users.push(await this.createUser())
    }
    return users
  }

  async createMeetings(count: number, organizer?: any) {
    const meetings = []
    for (let i = 0; i < count; i++) {
      meetings.push(await this.createMeeting({ organizer }))
    }
    return meetings
  }

  // Clean up method
  async cleanup() {
    await this.prisma.$transaction([
      this.prisma.meetingAuditLog.deleteMany(),
      this.prisma.meetingAttendee.deleteMany(),
      this.prisma.meetingNote.deleteMany(),
      this.prisma.meetingActionItems.deleteMany(),
      this.prisma.agendaItemComment.deleteMany(),
      this.prisma.agendaItemAttachment.deleteMany(),
      this.prisma.meetingAgendaItems.deleteMany(),
      this.prisma.meeting.deleteMany(),
      this.prisma.notification.deleteMany(),
      this.prisma.activityLog.deleteMany(),
      this.prisma.staff.deleteMany(),
      this.prisma.user.deleteMany(),
    ])
  }
}
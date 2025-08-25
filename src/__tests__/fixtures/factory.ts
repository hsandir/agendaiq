import { faker } from '@faker-js/faker'
import { PrismaClient, users, staff, role, department, school, district, meeting, meeting_attendee, meeting_agenda_items } from '@prisma/client'
import bcrypt from 'bcryptjs'

interface UserOverrides {
  password?: string
  email?: string
  name?: string
  emailVerified?: Date
  two_factor_enabled?: boolean
}

interface StaffWithRelations extends staff {
  users: users
  role: role
  department: department & { school: school & { district: district } }
  school: school & { district: district }
  district: district
}

interface StaffOverrides {
  user?: users
  role?: role
  department?: department & { school: school & { district: district } }
  school?: school & { district: district }
  district?: district
}

interface MeetingOverrides {
  organizer?: StaffWithRelations
  start_time?: Date
  end_time?: Date
}

export class TestFactory {
  constructor(private prisma: PrismaClient) {}

  // User factory
  async createUser(overrides: UserOverrides = {}): Promise<users> {
    const password = overrides.password ?? 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    return this.prisma.users.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        hashed_password: hashedPassword,
        email_verified: new Date(),
        two_factor_enabled: false,
        updated_at: new Date(),
        ...overrides,
      },
    })
  }

  // Staff factory
  async createStaff(overrides: StaffOverrides = {}): Promise<StaffWithRelations> {
    const user = overrides.user ?? await this.createUser()
    const role = overrides.role ?? await this.getOrCreateRole('Teacher')
    const department = overrides.department ?? await this.getOrCreateDepartment()
    const school = overrides.school ?? department.school
    const district = overrides.district ?? school.district

    const staffData = {
      user_id: user.id,
      role_id: role.id,
      department_id: department.id,
      school_id: school.id,
      district_id: district.id,
      hire_date: faker.date.past({ years: 5 }),
      is_active: true,
      flags: [],
      endorsements: [],
      extension: null,
      room: null,
      manager_id: null,
    };

    return this.prisma.staff.create({
      data: staffData,
      include: {
        users: true,
        role: true,
        department: {
          include: {
            school: {
              include: {
                district: true,
              },
            },
          },
        },
        school: {
          include: {
            district: true,
          },
        },
        district: true,
      },
    })
  }

  // Meeting factory
  async createMeeting(overrides: MeetingOverrides = {}): Promise<meeting> {
    const organizer = overrides.organizer ?? await this.createStaff()
    const startTime = overrides.start_time ?? faker.date.future()
    const endTime = overrides.end_time ?? new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour later

    return this.prisma.meeting.create({
      data: {
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        start_time: startTime,
        end_time: endTime,
        organizer_id: organizer.id,
        department_id: (organizer as staff).department_id,
        school_id: (organizer as staff).school_id,
        district_id: (organizer as staff).district_id,
        status: 'draft',
        meeting_type: 'REGULAR',
        ...overrides,
      },
      include: {
        staff: {
          include: {
            users: true,
            role: true,
          },
        },
        meeting_attendee: {
          include: {
            staff: {
              include: {
                users: true,
              },
            },
          },
        },
        meeting_agenda_items: true,
      },
    })
  }

  // Meeting with attendees
  async createMeetingWithAttendees(attendeeCount: number = 3, overrides: MeetingOverrides = {}): Promise<{ meeting: meeting; attendees: meeting_attendee[] }> {
    const meeting = await this.createMeeting(overrides)
    const attendees = []

    for (let i = 0; i < attendeeCount; i++) {
      const staff = await this.createStaff()
      const attendee = await this.prisma.meeting_attendee.create({
        data: {
          meeting_id: meeting.id,
          staff_id: staff.id,
          status: faker.helpers.arrayElement(['PENDING', 'ACCEPTED', 'DECLINED']),
        },
        include: {
          staff: {
            include: {
              users: true,
              role: true,
            },
          },
        },
      })
      attendees.push(attendee)
    }

    return { meeting, attendees }
  }

  // Agenda item factory
  async createAgendaItem(meeting: { id: number }, overrides: Partial<meeting_agenda_items> & { presenter?: StaffWithRelations } = {}): Promise<meeting_agenda_items> {
    const presenter = overrides.presenter ?? await this.createStaff()

    return this.prisma.meeting_agenda_items.create({
      data: {
        meeting_id: meeting.id,
        topic: faker.lorem.sentence(),
        problem_statement: faker.lorem.paragraph(),
        responsible_staff_id: presenter.id,
        purpose: faker.helpers.arrayElement(['Discussion', 'Decision', 'Information_Sharing', 'Reminder']),
        duration_minutes: faker.number.int({ min: 5, max: 30 }),
        order_index: overrides.order_index ?? faker.number.int({ min: 1, max: 10 }),
        status: 'Pending',
        updated_at: new Date(),
        ...overrides,
      },
    })
  }

  // Helper methods
  private async getOrCreateRole(title: string = 'Teacher'): Promise<role> {
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

  private async getOrCreateDepartment(): Promise<department & { school: school & { district: district } }> {
    let department = await this.prisma.department.findFirst({
      include: {
        school: {
          include: {
            district: true,
          },
        },
      },
    })
    
    if (!department) {
      const school = await this.getOrCreateSchool()
      department = await this.prisma.department.create({
        data: {
          name: faker.commerce.department(),
          code: faker.string.alphanumeric(6).toUpperCase(),
          school_id: school.id,
        },
        include: {
          school: {
            include: {
              district: true,
            },
          },
        },
      })
    }
    
    return department
  }

  private async getOrCreateSchool(): Promise<school & { district: district }> {
    let school = await this.prisma.school.findFirst({
      include: {
        district: true,
      },
    })
    
    if (!school) {
      const district = await this.getOrCreateDistrict()
      school = await this.prisma.school.create({
        data: {
          name: faker.company.name() + ' School',
          code: faker.string.alphanumeric(6).toUpperCase(),
          district_id: district.id,
          address: faker.location.streetAddress(),
        },
        include: {
          district: true,
        },
      })
    }
    
    return school
  }

  private async getOrCreateDistrict(): Promise<district> {
    let district = await this.prisma.district.findFirst()
    
    if (!district) {
      district = await this.prisma.district.create({
        data: {
          name: faker.location.county() + ' District',
          code: faker.string.alphanumeric(6).toUpperCase(),
          address: faker.location.streetAddress(),
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
    return priorities[title] ?? 10
  }

  // Bulk creation methods
  async createUsers(count: number): Promise<users[]> {
    const usersArray: users[] = []
    for (let i = 0; i < count; i++) {
      usersArray.push(await this.createUser())
    }
    return usersArray
  }

  async createMeetings(count: number, organizer?: StaffWithRelations): Promise<meeting[]> {
    const meetings: meeting[] = []
    for (let i = 0; i < count; i++) {
      meetings.push(await this.createMeeting({ organizer }))
    }
    return meetings
  }

  // Clean up method
  async cleanup() {
    await this.prisma.$transaction([
      this.prisma.meeting_audit_logs.deleteMany(),
      this.prisma.meeting_attendee.deleteMany(),
      this.prisma.meeting_notes.deleteMany(),
      this.prisma.meeting_action_items.deleteMany(),
      this.prisma.agenda_item_comments.deleteMany(),
      this.prisma.agenda_item_attachments.deleteMany(),
      this.prisma.meeting_agenda_items.deleteMany(),
      this.prisma.meeting.deleteMany(),
      // this.prisma.notification.deleteMany(), // Model doesn't exist
      // this.prisma.activityLog.deleteMany(), // Model doesn't exist
      this.prisma.staff.deleteMany(),
      this.prisma.users.deleteMany(),
    ])
  }
}
import { faker } from '@faker-js/faker'
import { PrismaClient, User, Staff, Role, Department, School, District, Meeting, MeetingAttendee, MeetingAgendaItem } from '@prisma/client'
import bcrypt from 'bcryptjs'

interface UserOverrides {
  password?: string
  email?: string
  name?: string
  emailVerified?: Date
  two_factor_enabled?: boolean
}

interface StaffWithRelations extends Staff {
  User: User
  Role: Role
  Department: Department & { School: School & { District: District } }
  School: School & { District: District }
  District: District
}

interface StaffOverrides {
  user?: User
  role?: Role
  department?: Department & { School: School & { District: District } }
  school?: School & { District: District }
  district?: District
}

interface MeetingOverrides {
  organizer?: StaffWithRelations
  start_time?: Date
  end_time?: Date
}

export class TestFactory {
  constructor(private prisma: PrismaClient) {}

  // User factory
  async createUser(overrides: UserOverrides = {}): Promise<User> {
    const password = overrides.password ?? 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    return this.prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        hashedPassword: hashedPassword,
        emailVerified: new Date(),
        two_factor_enabled: false,
        ...overrides,
      },
    })
  }

  // Staff factory
  async createStaff(overrides: StaffOverrides = {}): Promise<StaffWithRelations> {
    const user = overrides.user ?? await this.createUser()
    const role = overrides.role ?? await this.getOrCreateRole('Teacher')
    const department = overrides.department ?? await this.getOrCreateDepartment()
    const school = overrides.school ?? department.School
    const district = overrides.district ?? school.District

    return this.prisma.staff.create({
      data: {
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
        ...overrides,
      },
      include: {
        User: true,
        Role: true,
        Department: {
          include: {
            School: {
              include: {
                District: true,
              },
            },
          },
        },
        School: {
          include: {
            District: true,
          },
        },
        District: true,
      },
    })
  }

  // Meeting factory
  async createMeeting(overrides: MeetingOverrides = {}): Promise<Meeting> {
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
        department_id: (organizer as Staff).department_id,
        school_id: (organizer as Staff).school_id,
        district_id: (organizer as Staff).district_id,
        status: 'draft',
        meeting_type: 'REGULAR',
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
  async createMeetingWithAttendees(attendeeCount: number = 3, overrides: MeetingOverrides = {}): Promise<{ meeting: Meeting; attendees: MeetingAttendee[] }> {
    const meeting = await this.createMeeting(overrides)
    const attendees = []

    for (let i = 0; i < attendeeCount; i++) {
      const staff = await this.createStaff()
      const attendee = await this.prisma.meetingAttendee.create({
        data: {
          meeting_id: meeting.id,
          staff_id: staff.id,
          status: faker.helpers.arrayElement(['PENDING', 'ACCEPTED', 'DECLINED']),
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
  async createAgendaItem(meeting: { id: number }, overrides: Partial<MeetingAgendaItem> & { presenter?: StaffWithRelations } = {}): Promise<MeetingAgendaItem> {
    const presenter = overrides.presenter ?? await this.createStaff()

    return this.prisma.meetingAgendaItem.create({
      data: {
        meeting_id: meeting.id,
        topic: faker.lorem.sentence(),
        problem_statement: faker.lorem.paragraph(),
        responsible_staff_id: presenter.id,
        purpose: faker.helpers.arrayElement(['Discussion', 'Decision', 'Information_Sharing', 'Reminder']),
        duration_minutes: faker.number.int({ min: 5, max: 30 }),
        order_index: overrides.order_index ?? faker.number.int({ min: 1, max: 10 }),
        status: 'Pending',
        ...overrides,
      },
    })
  }

  // Helper methods
  private async getOrCreateRole(title: string = 'Teacher'): Promise<Role> {
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

  private async getOrCreateDepartment(): Promise<Department & { School: School & { District: District } }> {
    let department = await this.prisma.department.findFirst({
      include: {
        School: {
          include: {
            District: true,
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

  private async getOrCreateSchool(): Promise<School & { District: District }> {
    let school = await this.prisma.school.findFirst({
      include: {
        District: true,
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
          District: true,
        },
      })
    }
    
    return school
  }

  private async getOrCreateDistrict(): Promise<District> {
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
  async createUsers(count: number): Promise<User[]> {
    const users: User[] = []
    for (let i = 0; i < count; i++) {
      users.push(await this.createUser())
    }
    return users
  }

  async createMeetings(count: number, organizer?: StaffWithRelations): Promise<Meeting[]> {
    const meetings: Meeting[] = []
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
      this.prisma.meetingActionItem.deleteMany(),
      this.prisma.agendaItemComment.deleteMany(),
      this.prisma.agendaItemAttachment.deleteMany(),
      this.prisma.meetingAgendaItem.deleteMany(),
      this.prisma.meeting.deleteMany(),
      // this.prisma.notification.deleteMany(), // Model doesn't exist
      // this.prisma.activityLog.deleteMany(), // Model doesn't exist
      this.prisma.staff.deleteMany(),
      this.prisma.user.deleteMany(),
    ])
  }
}
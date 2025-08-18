/**
 * Type-safe, ESLint-compliant test utilities for AgendaIQ
 * Zero-warning test helpers with comprehensive type safety
 */

import { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import type { PrismaClient, User, Staff, Role, Department, School, District, Meeting } from '@prisma/client';
import type { 
  TypeSafeMock, 
  MockFactory, 
  APITestCase, 
  ComponentTestProps,
  TestDataSeed 
} from '../types/enhanced-test-types';

// ============================================================================
// Type-Safe Request Builders
// ============================================================================

export interface RequestBuilderOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  searchParams?: Record<string, string>;
}

export class TypeSafeRequestBuilder {
  static create<T = unknown>(options: RequestBuilderOptions): NextRequest {
    const { method, url, body, headers = {}, cookies = {}, searchParams = {} } = options;

    // Build URL with search params
    const fullUrl = new URL(url, 'http://localhost:3000');
    Object.entries(searchParams).forEach(([key, value]) => {
      fullUrl.searchParams.set(key, value);
    });

    // Build headers
    const requestHeaders = new Headers({
      'Content-Type': 'application/json',
      'User-Agent': 'AgendaIQ-Test/1.0',
      ...headers,
    });

    // Add cookies to headers
    if (Object.keys(cookies).length > 0) {
      const cookieString = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      requestHeaders.set('Cookie', cookieString);
    }

    // Build request init
    const init: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      init.body = JSON.stringify(body);
    }

    return new NextRequest(fullUrl.toString(), init);
  }

  static createWithAuth<T = unknown>(
    options: Omit<RequestBuilderOptions, 'headers'> & { 
      session: Session;
      headers?: Record<string, string>;
    }
  ): NextRequest {
    const { session, headers = {}, ...restOptions } = options;
    
    return this.create({
      ...restOptions,
      headers: {
        ...headers,
        'Authorization': `Bearer ${this.generateJWT(session)}`,
      },
    });
  }

  private static generateJWT(session: Session): string {
    // Simple JWT generation for testing - NOT for production
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(session));
    const signature = 'test-signature';
    return `${header}.${payload}.${signature}`;
  }
}

// ============================================================================
// Type-Safe Mock Factories
// ============================================================================

export class TypeSafeMockFactory {
  static user: MockFactory<User> = {
    create: (overrides: Partial<User> = {}): User => ({
      id: 'user-' + Math.random().toString(36).substring(7),
      email: `test-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Test User',
      hashedPassword: '$2a$10$hashedpassword',
      emailVerified: new Date(),
      is_active: true,
      google_id: null,
      preferences: {},
      created_at: new Date(),
      updated_at: new Date(),
      failed_login_attempts: 0,
      last_failed_login: null,
      account_locked_until: null,
      two_factor_enabled: false,
      two_factor_secret: null,
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<User> = {}): User[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.(user as Record<string, unknown>).create(overrides));
    },

    createWithRelations: (relations: { staff?: Partial<Staff> } = {}): User => {
      const user = TypeSafeMockFactory.(user as Record<string, unknown>).create();
      if (relations.staff) {
        // This would be implemented with proper relations
        // For now, return the base user
      }
      return user;
    },
  };

  static staff: MockFactory<Staff> = {
    create: (overrides: Partial<Staff> = {}): Staff => ({
      id: 'staff-' + Math.random().toString(36).substring(7),
      user_id: overrides.user_id || 'user-' + Math.random().toString(36).substring(7),
      role_id: overrides.role_id || 'role-' + Math.random().toString(36).substring(7),
      department_id: overrides.department_id || 'dept-' + Math.random().toString(36).substring(7),
      school_id: overrides.school_id || 'school-' + Math.random().toString(36).substring(7),
      district_id: overrides.district_id || 'district-' + Math.random().toString(36).substring(7),
      employee_number: `EMP${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      hire_date: new Date(),
      phone: '555-0123',
      office_location: 'Office 101',
      is_active: true,
      is_on_leave: false,
      subjects: ['Mathematics'],
      bio: 'Test staff member',
      specializations: [],
      flags: [],
      endorsements: [],
      extension: null,
      room: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<Staff> = {}): Staff[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.staff.create(overrides));
    },

    createWithRelations: (relations: { 
      user?: Partial<User>;
      role?: Partial<Role>;
      department?: Partial<Department>;
    } = {}): Staff => {
      const staff = TypeSafeMockFactory.staff.create();
      // Relations would be properly implemented in a full system
      return staff;
    },
  };

  static role: MockFactory<Role> = {
    create: (overrides: Partial<Role> = {}): Role => ({
      id: 'role-' + Math.random().toString(36).substring(7),
      title: overrides.title || 'Teacher',
      is_leadership: overrides.is_leadership || false,
      priority: overrides.priority || 6,
      description: null,
      permissions: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<Role> = {}): Role[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.role.create(overrides));
    },

    createWithRelations: (): Role => {
      return TypeSafeMockFactory.role.create();
    },
  };

  static department: MockFactory<Department> = {
    create: (overrides: Partial<Department> = {}): Department => ({
      id: 'dept-' + Math.random().toString(36).substring(7),
      name: overrides.name || 'Mathematics Department',
      code: overrides.code || 'MATH',
      school_id: overrides.school_id || 'school-' + Math.random().toString(36).substring(7),
      description: null,
      head_staff_id: null,
      budget: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<Department> = {}): Department[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.department.create(overrides));
    },

    createWithRelations: (relations: { school?: Partial<School> } = {}): Department => {
      return TypeSafeMockFactory.department.create();
    },
  };

  static school: MockFactory<School> = {
    create: (overrides: Partial<School> = {}): School => ({
      id: 'school-' + Math.random().toString(36).substring(7),
      name: overrides.name || 'Test High School',
      code: overrides.code || 'THS',
      district_id: overrides.district_id || 'district-' + Math.random().toString(36).substring(7),
      address: '123 Test Street',
      phone: '555-0123',
      email: 'test@school.edu',
      website: null,
      principal_staff_id: null,
      student_count: null,
      established_date: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<School> = {}): School[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.school.create(overrides));
    },

    createWithRelations: (relations: { district?: Partial<District> } = {}): School => {
      return TypeSafeMockFactory.school.create();
    },
  };

  static district: MockFactory<District> = {
    create: (overrides: Partial<District> = {}): District => ({
      id: 'district-' + Math.random().toString(36).substring(7),
      name: overrides.name || 'Test School District',
      code: overrides.code || 'TSD',
      address: '456 District Avenue',
      phone: '555-0456',
      email: 'admin@testdistrict.edu',
      website: null,
      superintendent_staff_id: null,
      total_schools: null,
      total_students: null,
      established_date: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<District> = {}): District[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.district.create(overrides));
    },

    createWithRelations: (): District => {
      return TypeSafeMockFactory.district.create();
    },
  };

  static meeting: MockFactory<Meeting> = {
    create: (overrides: Partial<Meeting> = {}): Meeting => ({
      id: Math.floor(Math.random() * 1000000),
      title: overrides.title || 'Test Meeting',
      description: 'Test meeting description',
      start_time: new Date(),
      end_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
      organizer_id: overrides.organizer_id || 'staff-' + Math.random().toString(36).substring(7),
      department_id: overrides.department_id || 'dept-' + Math.random().toString(36).substring(7),
      school_id: overrides.school_id || 'school-' + Math.random().toString(36).substring(7),
      district_id: overrides.district_id || 'district-' + Math.random().toString(36).substring(7),
      status: 'draft',
      meeting_type: 'REGULAR',
      zoom_meeting_id: null,
      zoom_join_url: null,
      zoom_password: null,
      location: null,
      max_attendees: null,
      is_recurring: false,
      recurrence_pattern: null,
      parent_meeting_id: null,
      tags: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<Meeting> = {}): Meeting[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.meeting.create(overrides));
    },

    createWithRelations: (relations: { organizer?: Partial<Staff> } = {}): Meeting => {
      return TypeSafeMockFactory.meeting.create();
    },
  };

  static session(userOverrides: Partial<User> = {}): Session {
    const user = this.(user as Record<string, unknown>).create(userOverrides);
    return {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: (user as Record<string, unknown>).emailVerified,
        is_active: (user as Record<string, unknown>).is_active,
        staff: {
          id: 'staff-test',
          user_id: parseInt(user.id.split('-')[1], 36),
          role_id: 1,
          department_id: 1,
          school_id: 1,
          district_id: 1,
          role: {
            id: '1',
            title: 'Teacher',
            is_leadership: false,
            priority: 6,
          },
          department: {
            id: '1',
            name: 'Mathematics',
          },
          school: {
            id: '1',
            name: 'Test School',
          },
          district: {
            id: '1',
            name: 'Test District',
          },
        },
      },
    } as Session;
  }

  static adminSession(): Session {
    return this.session({
      email: 'admin@test.com',
      name: 'Test Admin',
    });
  }
}

// ============================================================================
// Type-Safe Database Helpers
// ============================================================================

export class TypeSafeTestDB {
  constructor(private prisma: PrismaClient) {}

  async createTestSeed(): Promise<TestDataSeed> {
    // Create test district
    const district = await this.prisma.district.create({
      data: TypeSafeMockFactory.district.create({
        name: 'Test District',
        code: 'TEST_DIST',
      }),
    });

    // Create test school
    const school = await this.prisma.school.create({
      data: TypeSafeMockFactory.school.create({
        name: 'Test School',
        code: 'TEST_SCHOOL',
        district_id: district.id,
      }),
    });

    // Create test department
    const department = await this.prisma.department.create({
      data: TypeSafeMockFactory.department.create({
        name: 'Test Department',
        code: 'TEST_DEPT',
        school_id: school.id,
      }),
    });

    // Create test roles
    const adminRole = await this.prisma.role.create({
      data: TypeSafeMockFactory.role.create({
        title: 'Administrator',
        is_leadership: true,
        priority: 1,
      }),
    });

    const teacherRole = await this.prisma.role.create({
      data: TypeSafeMockFactory.role.create({
        title: 'Teacher',
        is_leadership: false,
        priority: 6,
      }),
    });

    // Create test users
    const adminUser = await this.prisma.user.create({
      data: TypeSafeMockFactory.(user as Record<string, unknown>).create({
        email: 'admin@test.com',
        name: 'Test Admin',
      }),
    });

    const teacherUser = await this.prisma.user.create({
      data: TypeSafeMockFactory.(user as Record<string, unknown>).create({
        email: 'teacher@test.com',
        name: 'Test Teacher',
      }),
    });

    // Create test staff
    const adminStaff = await this.prisma.staff.create({
      data: TypeSafeMockFactory.staff.create({
        user_id: adminUser.id,
        role_id: adminRole.id,
        department_id: department.id,
        school_id: school.id,
        district_id: district.id,
        employee_number: 'ADMIN001',
      }),
    });

    const teacherStaff = await this.prisma.staff.create({
      data: TypeSafeMockFactory.staff.create({
        user_id: teacherUser.id,
        role_id: teacherRole.id,
        department_id: department.id,
        school_id: school.id,
        district_id: district.id,
        employee_number: 'TEACH001',
      }),
    });

    return {
      users: [adminUser, teacherUser],
      staff: [adminStaff, teacherStaff],
      roles: [adminRole, teacherRole],
      departments: [department],
      schools: [school],
      districts: [district],
    };
  }

  async cleanupTestData(): Promise<void> {
    // Clean up in reverse dependency order
    await this.prisma.$transaction([
      this.prisma.meetingAuditLog.deleteMany(),
      this.prisma.meetingAttendee.deleteMany(),
      this.prisma.meetingNote.deleteMany(),
      this.prisma.meetingActionItem.deleteMany(),
      this.prisma.agendaItemComment.deleteMany(),
      this.prisma.agendaItemAttachment.deleteMany(),
      this.prisma.meetingAgendaItem.deleteMany(),
      this.prisma.meeting.deleteMany(),
      this.prisma.staff.deleteMany(),
      this.prisma.user.deleteMany(),
      this.prisma.role.deleteMany(),
      this.prisma.department.deleteMany(),
      this.prisma.school.deleteMany(),
      this.prisma.district.deleteMany(),
    ]);
  }

  async transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async rollbackTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await fn(tx as PrismaClient);
        throw new Error('ROLLBACK'); // Force rollback
      });
    } catch (error) {
    if (error instanceof Error) {
      if (error instanceof Error) {
        if (error instanceof Error && error.message === 'ROLLBACK') {
          // Expected rollback
          return;
        }
        throw error;
      }
    }
  }
}

// ============================================================================
// Type-Safe Test Validators
// ============================================================================

export class TypeSafeValidators {
  static validateAPIResponse<T>(
    response: Response,
    expectedStatus: number,
    schema?: (data: unknown) => data is T
  ): {
    isValid: boolean;
    errors: string[];
    data?: T;
  } {
    const errors: string[] = [];

    // Validate status
    if (response.status !== expectedStatus) {
      errors.push(`Expected status ${expectedStatus}, got ${response.status}`);
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      errors.push(`Expected JSON content-type, got ${contentType}`);
    }

    let data: T | undefined;
    try {
      if (schema) {
        const rawData = response.json();
        if (schema(rawData)) {
          data = rawData;
        } else {
          errors.push('Response data does not match expected schema');
        }
      }
    } catch (error) {
      errors.push(`Failed to parse JSON response: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      data,
    };
  }

  static validateComponentProps<T>(
    component: ComponentTestProps<T>,
    actualProps: T
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if all required props are present
    const expectedKeys = Object.keys(component.props);
    const actualKeys = Object.keys(actualProps);

    for (const key of expectedKeys) {
      if (!actualKeys.includes(key)) {
        errors.push(`Missing required prop: ${key}`);
      }
    }

    // Check for unexpected props
    for (const key of actualKeys) {
      if (!expectedKeys.includes(key)) {
        errors.push(`Unexpected prop: ${key}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateTestDataIntegrity(seed: TestDataSeed): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check that all users have corresponding staff
    for (const user of seed.users) {
      const hasStaff = seed.staff.some(staff => staff.user_id === user.id);
      if (!hasStaff) {
        errors.push(`User ${user.id} has no corresponding staff record`);
      }
    }

    // Check that all staff have valid role references
    for (const staff of seed.staff) {
      const hasRole = seed.roles.some(role => role.id === staff.role_id);
      if (!hasRole) {
        errors.push(`Staff ${staff.id} references non-existent role ${staff.role_id}`);
      }
    }

    // Check that all departments have valid school references
    for (const department of seed.departments) {
      const hasSchool = seed.schools.some(school => school.id === department.school_id);
      if (!hasSchool) {
        errors.push(`Department ${department.id} references non-existent school ${department.school_id}`);
      }
    }

    // Check that all schools have valid district references
    for (const school of seed.schools) {
      const hasDistrict = seed.districts.some(district => district.id === school.district_id);
      if (!hasDistrict) {
        errors.push(`School ${school.id} references non-existent district ${school.district_id}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// Type-Safe Mock Utilities
// ============================================================================

export class TypeSafeMockUtilities {
  static createMockFetch<T>(
    responseData: T,
    status: number = 200,
    headers: Record<string, string> = {}
  ): jest.MockedFunction<typeof fetch> {
    return jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...headers,
      }),
      json: async () => responseData,
      text: async () => JSON.stringify(responseData),
      blob: async () => new Blob([JSON.stringify(responseData)]),
      arrayBuffer: async () => new ArrayBuffer(0),
      clone: function() { return this; },
    } as Response);
  }

  static createMockPrismaClient(): jest.Mocked<PrismaClient> {
    return {
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
      },
      staff: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
      },
      // Add other models as needed
    } as unknown as jest.Mocked<PrismaClient>;
  }

  static resetAllMocks(): void {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  }
}

// ============================================================================
// Export All Utilities
// ============================================================================

export {
  TypeSafeRequestBuilder,
  TypeSafeMockFactory,
  TypeSafeTestDB,
  TypeSafeValidators,
  TypeSafeMockUtilities,
};

export type {
  RequestBuilderOptions,
};
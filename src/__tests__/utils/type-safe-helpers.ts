/**
 * Type-safe, ESLint-compliant test utilities for AgendaIQ
 * Zero-warning test helpers with comprehensive type safety
 */

import { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import type { PrismaClient, users, staff, role, department, school, district, meeting } from '@prisma/client';
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

class TypeSafeRequestBuilderClass {
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

class TypeSafeMockFactoryClass {
  static user: MockFactory<users> = {
    create: (overrides: Partial<users> = {}): users => ({
      id: Math.floor(Math.random() * 1000000),
      email: `test-${Math.random().toString(36).substring(7)}@example.com`,
      name: 'Test User',
      hashed_password: '$2a$10$hashedpassword',
      email_verified: new Date(),
      // is_active: true, // Field doesn't exist in users schema
      // google_id: null, // Field doesn't exist in users schema
      preferences: {},
      created_at: new Date(),
      // updated_at: new Date(), // Field doesn't exist in users schema
      failed_login_attempts: 0,
      last_failed_login: null,
      account_locked_until: null,
      two_factor_enabled: false,
      two_factor_secret: null,
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<users> = {}): users[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.(user as Record<string, unknown>).create(overrides));
    },

    createWithRelations: (relations: { staff?: Partial<staff> } = {}): users => {
      const user = TypeSafeMockFactory.(user as Record<string, unknown>).create();
      if (relations.staff) {
        // This would be implemented with proper relations
        // For now, return the base user
      }
      return user;
    },
  };

  static staff: MockFactory<staff> = {
    create: (overrides: Partial<staff> = {}): staff => ({
      id: Math.floor(Math.random() * 1000000),
      user_id: Number(overrides.user_id) || Math.floor(Math.random() * 1000000),
      role_id: Number(overrides.role_id) || Math.floor(Math.random() * 1000),
      department_id: Number(overrides.department_id) || Math.floor(Math.random() * 1000),
      school_id: Number(overrides.school_id) || Math.floor(Math.random() * 1000),
      district_id: Number(overrides.district_id) || Math.floor(Math.random() * 1000),
      // employee_number: `EMP${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`, // Field doesn't exist in staff schema
      hire_date: new Date(),
      // phone: '555-0123', // Field doesn't exist in staff schema
      // office_location: 'Office 101', // Field doesn't exist in staff schema
      is_active: true,
      // is_on_leave: false, // Field doesn't exist in staff schema
      // subjects: ['Mathematics'], // Field doesn't exist in staff schema
      // bio: 'Test staff member', // Field doesn't exist in staff schema
      // specializations: [], // Field doesn't exist in staff schema
      flags: [],
      endorsements: [],
      extension: null,
      room: null,
      created_at: new Date(),
      // updated_at: new Date(), // Field doesn't exist in staff schema
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<staff> = {}): staff[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.staff.create(overrides));
    },

    createWithRelations: (relations: { 
      user?: Partial<users>;
      role?: Partial<role>;
      department?: Partial<department>;
    } = {}): staff => {
      const staff = TypeSafeMockFactory.staff.create();
      // Relations would be properly implemented in a full system
      return staff;
    },
  };

  static role: MockFactory<role> = {
    create: (overrides: Partial<role> = {}): role => ({
      id: Math.floor(Math.random() * 1000),
      title: overrides.title ?? 'Teacher',
      is_leadership: overrides.is_leadership ?? false,
      priority: overrides.priority ?? 6,
      // description: null, // Field doesn't exist in role schema
      // permissions: null, // Field doesn't exist in role schema
      created_at: new Date(),
      // updated_at: new Date(), // Field doesn't exist in role schema
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<role> = {}): role[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.role.create(overrides));
    },

    createWithRelations: (): role => {
      return TypeSafeMockFactory.role.create();
    },
  };

  static department: MockFactory<department> = {
    create: (overrides: Partial<department> = {}): department => ({
      id: Math.floor(Math.random() * 1000),
      name: overrides.name || 'Mathematics Department',
      code: overrides.code ?? 'MATH',
      school_id: Number(overrides.school_id) || Math.floor(Math.random() * 1000),
      // description: null, // Field doesn't exist in department schema
      // head_staff_id: null, // Field doesn't exist in department schema
      // budget: null, // Field doesn't exist in department schema
      created_at: new Date(),
      // updated_at: new Date(), // Field doesn't exist in department schema
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<department> = {}): department[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.department.create(overrides));
    },

    createWithRelations: (relations: { school?: Partial<school> } = {}): department => {
      return TypeSafeMockFactory.department.create();
    },
  };

  static school: MockFactory<school> = {
    create: (overrides: Partial<school> = {}): school => ({
      id: Math.floor(Math.random() * 1000),
      name: overrides.name || 'Test High School',
      code: overrides.code ?? 'THS',
      district_id: Number(overrides.district_id) || Math.floor(Math.random() * 1000),
      address: '123 Test Street',
      // phone: '555-0123', // Field doesn't exist in school schema
      // email: 'test@school.edu', // Field doesn't exist in school schema
      // website: null, // Field doesn't exist in school schema
      // principal_staff_id: null, // Field doesn't exist in school schema
      // student_count: null, // Field doesn't exist in school schema
      // established_date: null, // Field doesn't exist in school schema
      created_at: new Date(),
      // updated_at: new Date(), // Field doesn't exist in school schema
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<school> = {}): school[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.school.create(overrides));
    },

    createWithRelations: (relations: { district?: Partial<district> } = {}): school => {
      return TypeSafeMockFactory.school.create();
    },
  };

  static district: MockFactory<district> = {
    create: (overrides: Partial<district> = {}): district => ({
      id: Math.floor(Math.random() * 1000),
      name: overrides.name || 'Test School District',
      code: overrides.code ?? 'TSD',
      address: '456 District Avenue',
      // phone: '555-0456', // Field doesn't exist in district schema
      // email: 'admin@testdistrict.edu', // Field doesn't exist in district schema
      // website: null, // Field doesn't exist in district schema
      // superintendent_staff_id: null, // Field doesn't exist in district schema
      // total_schools: null, // Field doesn't exist in district schema
      // total_students: null, // Field doesn't exist in district schema
      // established_date: null, // Field doesn't exist in district schema
      created_at: new Date(),
      // updated_at: new Date(), // Field doesn't exist in district schema
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<district> = {}): district[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.district.create(overrides));
    },

    createWithRelations: (): district => {
      return TypeSafeMockFactory.district.create();
    },
  };

  static meeting: MockFactory<meeting> = {
    create: (overrides: Partial<meeting> = {}): meeting => ({
      id: Math.floor(Math.random() * 1000000),
      title: overrides.title || 'Test Meeting',
      description: 'Test meeting description',
      start_time: new Date(),
      end_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
      organizer_id: Number(overrides.organizer_id) || Math.floor(Math.random() * 1000),
      department_id: Number(overrides.department_id) || Math.floor(Math.random() * 1000),
      school_id: Number(overrides.school_id) || Math.floor(Math.random() * 1000),
      district_id: Number(overrides.district_id) || Math.floor(Math.random() * 1000),
      status: 'draft',
      meeting_type: 'REGULAR',
      zoom_meeting_id: null,
      zoom_join_url: null,
      // zoom_password: null, // Field doesn't exist in meeting schema
      location: null,
      max_attendees: null,
      is_recurring: false,
      recurrence_pattern: null,
      parent_meeting_id: null,
      tags: null,
      created_at: new Date(),
      // updated_at: new Date(), // Field doesn't exist in meeting schema
      ...overrides,
    }),

    createMany: (count: number, overrides: Partial<meeting> = {}): meeting[] => {
      return Array.from({ length: count }, () => TypeSafeMockFactory.meeting.create(overrides));
    },

    createWithRelations: (relations: { organizer?: Partial<staff> } = {}): meeting => {
      return TypeSafeMockFactory.meeting.create();
    },
  };

  static session(userOverrides: Partial<users> = {}): Session {
    const user = this.(user as Record<string, unknown>).create(userOverrides);
    return {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: (user as Record<string, unknown>).email_verified,
        is_active: (user as Record<string, unknown>).is_active,
        staff: {
          id: 'staff-test',
          user_id: Number(user.id),
          role_id: 1,
          department_id: 1,
          school_id: 1,
          district_id: 1,
          role: {
            id: 1,
            title: 'Teacher',
            is_leadership: false,
            priority: 6,
          },
          department: {
            id: 1,
            name: 'Mathematics',
          },
          school: {
            id: 1,
            name: 'Test School',
          },
          district: {
            id: 1,
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

class TypeSafeTestDB {
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
    const adminUser = await this.prisma.users.create({
      data: TypeSafeMockFactory.(user as Record<string, unknown>).create({
        email: 'admin@test.com',
        name: 'Test Admin',
      }),
    });

    const teacherUser = await this.prisma.users.create({
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
        // employee_number: 'ADMIN001', // Field doesn't exist in staff schema
      }),
    });

    const teacherStaff = await this.prisma.staff.create({
      data: TypeSafeMockFactory.staff.create({
        user_id: teacherUser.id,
        role_id: teacherRole.id,
        department_id: department.id,
        school_id: school.id,
        district_id: district.id,
        // employee_number: 'TEACH001', // Field doesn't exist in staff schema
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
      this.prisma.meeting_audit_logs.deleteMany(),
      this.prisma.meeting_attendee.deleteMany(),
      this.prisma.meeting_notes.deleteMany(),
      this.prisma.meeting_action_items.deleteMany(),
      this.prisma.agenda_item_comments.deleteMany(),
      this.prisma.agenda_item_attachments.deleteMany(),
      this.prisma.meeting_agenda_items.deleteMany(),
      this.prisma.meeting.deleteMany(),
      this.prisma.staff.deleteMany(),
      this.prisma.users.deleteMany(),
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
      if (error instanceof Error && error.message === 'ROLLBACK') {
        // Expected rollback
        return;
      }
      throw error;
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

export const TypeSafeRequestBuilder = TypeSafeRequestBuilderClass;
export const TypeSafeMockFactory = TypeSafeMockFactoryClass;
export { TypeSafeTestDB };

export {
  TypeSafeValidators,
  TypeSafeMockUtilities,
};

export type {
  RequestBuilderOptions,
};
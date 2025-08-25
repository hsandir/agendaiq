/**
 * Comprehensive Prisma Mocks for Testing
 * Zero Degradation Protocol: Provides consistent mocking across all tests
 */

// Create mock functions for all common Prisma operations
export const createMockPrismaOperation = () => ({
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

// Mock all database models consistently
export const mockPrisma = {
  users: createMockPrismaOperation(),
  staff: createMockPrismaOperation(),
  role: createMockPrismaOperation(),
  department: createMockPrismaOperation(),
  school: createMockPrismaOperation(),
  district: createMockPrismaOperation(),
  meeting: createMockPrismaOperation(),
  meeting_notes: createMockPrismaOperation(),
  meeting_attendee: createMockPrismaOperation(),
  meeting_agenda_items: createMockPrismaOperation(),
  user_capabilities: createMockPrismaOperation(),
  audit_logs: createMockPrismaOperation(),
  account: createMockPrismaOperation(),
  session: createMockPrismaOperation(),
  verification_token: createMockPrismaOperation(),
  teams: createMockPrismaOperation(),
  team_members: createMockPrismaOperation(),
  team_knowledge: createMockPrismaOperation(),
  // Transaction support
  $transaction: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Reset all mocks
export const resetPrismaMocks = () => {
  Object.values(mockPrisma).forEach(model => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach(operation => {
        if (jest.isMockFunction(operation)) {
          operation.mockClear();
        }
      });
    } else if (jest.isMockFunction(model)) {
      model.mockClear();
    }
  });
};

// Setup Prisma mock
export const setupPrismaMock = () => {
  jest.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
  }));
  
  resetPrismaMocks();
  
  // Set default successful responses
  mockPrisma.$transaction.mockImplementation(async (queries) => {
    if (Array.isArray(queries)) {
      return Promise.all(queries.map(() => ({})));
    }
    return {};
  });
};

// Common test data factories
export const createTestUserData = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: '$2a$10$hashedpassword',
  email_verified: true,
  is_active: true,
  is_system_admin: false,
  is_school_admin: false,
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
});

export const createTestStaffData = (overrides = {}) => ({
  id: 1,
  user_id: 1,
  role_id: 1,
  department_id: 1,
  school_id: 1,
  district_id: 1,
  employee_number: 'EMP001',
  hire_date: new Date(),
  phone: '1234567890',
  office_location: 'Building A',
  is_active: true,
  is_on_leave: false,
  subjects: ['Mathematics'],
  bio: 'Test bio',
  specializations: [],
  created_at: new Date(),
  updated_at: new Date(),
  role: {
    id: 1,
    title: 'Teacher',
    key: 'TEACHER',
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
  users: createTestUserData(),
  ...overrides,
});
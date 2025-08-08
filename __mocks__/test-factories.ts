// Test data factories for consistent mock data
import { User, Meeting, Staff, Role, Department, School, District } from '@prisma/client';

// Type definitions for extended models
export interface ExtendedUser extends User {
  staff?: ExtendedStaff | null;
}

export interface ExtendedStaff extends Staff {
  user: User;
  role: Role;
  department: Department;
  school: School;
  district: District;
}

export interface ExtendedMeeting extends Meeting {
  attendees?: any[];
  agendaItems?: any[];
  actionItems?: any[];
}

// Factory functions
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedPassword',
  emailVerified: null,
  image: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true,
  lastLogin: null,
  failedLoginAttempts: 0,
  lockoutUntil: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  resetToken: null,
  resetTokenExpiry: null,
  preferences: {},
  ...overrides,
});

export const createMockRole = (overrides?: Partial<Role>): Role => ({
  id: 1,
  title: 'Teacher',
  description: 'Teacher role',
  priority: 6,
  isLeadership: false,
  canManageMeetings: false,
  canManageStaff: false,
  canViewReports: true,
  permissions: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockDistrict = (overrides?: Partial<District>): District => ({
  id: 1,
  name: 'Test District',
  code: 'TD001',
  address: '123 District St',
  phone: '555-0100',
  email: 'district@test.com',
  website: 'https://district.test.com',
  superintendent: 'John Doe',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockSchool = (overrides?: Partial<School>): School => ({
  id: 1,
  name: 'Test School',
  code: 'TS001',
  type: 'HIGH_SCHOOL',
  address: '456 School Ave',
  phone: '555-0200',
  email: 'school@test.com',
  website: 'https://school.test.com',
  principal: 'Jane Smith',
  districtId: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockDepartment = (overrides?: Partial<Department>): Department => ({
  id: 1,
  name: 'Mathematics',
  code: 'MATH',
  description: 'Mathematics Department',
  schoolId: 1,
  headId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockStaff = (overrides?: Partial<Staff>): Staff => ({
  id: 1,
  userId: 1,
  employeeId: 'EMP001',
  title: 'Senior Teacher',
  roleId: 1,
  departmentId: 1,
  schoolId: 1,
  districtId: 1,
  phone: '555-0300',
  officeLocation: 'Room 101',
  managerId: null,
  startDate: new Date('2024-01-01'),
  endDate: null,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockMeeting = (overrides?: Partial<Meeting>): Meeting => ({
  id: 1,
  title: 'Test Meeting',
  description: 'Test meeting description',
  type: 'DEPARTMENT',
  status: 'SCHEDULED',
  startTime: new Date('2024-01-15T10:00:00'),
  endTime: new Date('2024-01-15T11:00:00'),
  location: 'Conference Room A',
  virtualLink: null,
  createdById: 1,
  departmentId: 1,
  schoolId: 1,
  recurringPattern: null,
  recurringEndDate: null,
  parentMeetingId: null,
  completionPercentage: 0,
  actualStartTime: null,
  actualEndTime: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Extended factory functions with relations
export const createMockExtendedUser = (overrides?: Partial<ExtendedUser>): ExtendedUser => {
  const user = createMockUser(overrides);
  const staff = overrides?.staff || null;
  
  return {
    ...user,
    staff,
  };
};

export const createMockExtendedStaff = (overrides?: Partial<ExtendedStaff>): ExtendedStaff => {
  const staff = createMockStaff(overrides);
  const user = overrides?.user || createMockUser({ id: staff.userId });
  const role = overrides?.role || createMockRole({ id: staff.roleId });
  const department = overrides?.department || createMockDepartment({ id: staff.departmentId });
  const school = overrides?.school || createMockSchool({ id: staff.schoolId });
  const district = overrides?.district || createMockDistrict({ id: staff.districtId });
  
  return {
    ...staff,
    user,
    role,
    department,
    school,
    district,
  };
};

export const createMockExtendedMeeting = (overrides?: Partial<ExtendedMeeting>): ExtendedMeeting => {
  const meeting = createMockMeeting(overrides);
  
  return {
    ...meeting,
    attendees: overrides?.attendees || [],
    agendaItems: overrides?.agendaItems || [],
    actionItems: overrides?.actionItems || [],
  };
};

// Helper function to create a complete mock session user
export const createMockSessionUser = (roleTitle: string = 'Teacher') => {
  const role = createMockRole({
    title: roleTitle,
    isLeadership: ['Administrator', 'Principal', 'Vice Principal', 'Department Head'].includes(roleTitle),
    priority: roleTitle === 'Administrator' ? 1 : 6,
  });
  
  const staff = createMockExtendedStaff({
    role,
    title: roleTitle,
  });
  
  return createMockExtendedUser({
    staff,
  });
};

// Export all factories
export const mockFactories = {
  user: createMockUser,
  role: createMockRole,
  district: createMockDistrict,
  school: createMockSchool,
  department: createMockDepartment,
  staff: createMockStaff,
  meeting: createMockMeeting,
  extendedUser: createMockExtendedUser,
  extendedStaff: createMockExtendedStaff,
  extendedMeeting: createMockExtendedMeeting,
  sessionUser: createMockSessionUser,
};
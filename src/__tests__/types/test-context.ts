/**
 * Test context types for consistent testing
 */

import type { PrismaClient, users, staff, role, department, school, district } from '@prisma/client';

export interface TestUser extends users {
  staff?: Array<staff & {
    role: role;
    department: department;
    school: school;
    district: district;
  }>;
}

export interface TestStaff extends staff {
  role: role;
  department: department;
  school: school;
  district: district;
}

export interface SeededTestData {
  adminUser: TestUser;
  teacherUser: TestUser;
  adminStaff: TestStaff;
  teacherStaff: TestStaff;
}

export interface TestContext extends SeededTestData {
  prisma: PrismaClient;
  factory: unknown; // Factory type to be defined later if needed
  cleanup: () => Promise<void>;
}
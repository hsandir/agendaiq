/**
 * Test context types for consistent testing
 */

import type { PrismaClient, User, Staff, Role, Department, School, District } from '@prisma/client';

export interface TestUser extends User {
  Staff?: Array<Staff & {
    Role: Role;
    Department: Department;
    School: School;
    District: District;
  }>;
}

export interface TestStaff extends Staff {
  Role: Role;
  Department: Department;
  School: School;
  District: District;
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
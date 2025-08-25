import { PrismaClient, users, staff, role } from '@prisma/client'
import { TestFactory } from '../fixtures/factory'

type UserWithStaff = users & {
  staff: (staff & {
    role: role;
    department: unknown;
    school: unknown;
    district: unknown
  })[]
}

let prisma: PrismaClient

export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    // Force test database URL
    const databaseUrl = 'postgresql://hs:yeni@localhost:5432/agendaiq_test';
    
    console.log('Using test database URL:', databaseUrl);

    prisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrl }
      },
      log: process.env.DEBUG === 'true' ? ['query', 'info', 'warn', 'error'] : [],
    });
  }

  return prisma
}

export function getTestFactory(): TestFactory {
  return new TestFactory(getTestPrismaClient())
}

export async function resetTestDatabase() {
  const prisma = getTestPrismaClient();
  // Clear all data in correct order
  await prisma.$transaction([
    prisma.meeting_audit_logs.deleteMany(),
    prisma.meeting_attendee.deleteMany(),
    prisma.meeting_notes.deleteMany(),
    prisma.meeting_action_items.deleteMany(),
    prisma.agenda_item_comments.deleteMany(),
    prisma.agenda_item_attachments.deleteMany(),
    prisma.meeting_agenda_items.deleteMany(),
    prisma.meeting.deleteMany(),
    // prisma.notification.deleteMany(), // Model doesn't exist
    // prisma.activityLog.deleteMany(), // Model doesn't exist
    prisma.staff.deleteMany(),
    prisma.users.deleteMany(),
    prisma.role.deleteMany(),
    prisma.department.deleteMany(),
    prisma.school.deleteMany(),
    prisma.district.deleteMany(),
  ])
}

export async function seedTestDatabase() {
  const prisma = getTestPrismaClient();
  // Use existing data from copied main database
  const users: UserWithStaff[] = await prisma.users.findMany({
    include: {
      staff: {
        include: {
          role: true,
          department: true,
          school: true,
          district: true
        }
      }
    }
  });
  if (users.length >= 2) {
    const adminUser = users.find(u => u.staff?.[0]?.role?.is_leadership) || users[0]
    const teacherUser = users.find(u => !u.staff?.[0]?.role?.is_leadership) || users[1]
    const adminStaff = adminUser.staff?.[0]
    const teacherStaff = teacherUser.staff?.[0]
    
    if (adminStaff && teacherStaff) {
      return { adminUser, teacherUser, adminStaff, teacherStaff }
    }
  }
  
  throw new Error('Test database should have been seeded with data from main database');
}

export async function disconnectTestDatabase() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// Transaction wrapper for tests
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getTestPrismaClient();
  return prisma.$transaction(async (tx) => {
    await fn(tx as PrismaClient);
    throw new Error('Rollback') // Force rollback
  }).catch((error) => {
    if (error instanceof Error && error.message === 'Rollback') {
      return undefined as T
    }
    throw error
  })
}

// Helper to create isolated test context
export async function createTestContext() {
  await resetTestDatabase();
  const seededData = await seedTestDatabase();
  const factory = getTestFactory();
  return {
    prisma: getTestPrismaClient(),
    factory,
    ...seededData,
    cleanup: async () => {
      await resetTestDatabase()
    }
  }
}
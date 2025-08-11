import { PrismaClient } from '@prisma/client'
import { TestFactory } from '../fixtures/factory'

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
    })
  }

  return prisma
}

export function getTestFactory(): TestFactory {
  return new TestFactory(getTestPrismaClient())
}

export async function resetTestDatabase() {
  const prisma = getTestPrismaClient()
  
  // Clear all data in correct order
  await prisma.$transaction([
    prisma.meetingAuditLog.deleteMany(),
    prisma.meetingAttendee.deleteMany(),
    prisma.meetingNote.deleteMany(),
    prisma.meetingActionItem.deleteMany(),
    prisma.agendaItemComment.deleteMany(),
    prisma.agendaItemAttachment.deleteMany(),
    prisma.meetingAgendaItem.deleteMany(),
    prisma.meeting.deleteMany(),
    // prisma.notification.deleteMany(), // Model doesn't exist
    // prisma.activityLog.deleteMany(), // Model doesn't exist
    prisma.staff.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
    prisma.department.deleteMany(),
    prisma.school.deleteMany(),
    prisma.district.deleteMany(),
  ])
}

export async function seedTestDatabase() {
  const prisma = getTestPrismaClient()
  
  // Use existing data from copied main database
  const users = await prisma.user.findMany({
    include: {
      Staff: {
        include: {
          Role: true,
          Department: true,
          School: true,
          District: true
        }
      }
    }
  })
  
  if (users.length >= 2) {
    const adminUser = users.find(u => u.Staff?.[0]?.Role?.is_leadership) || users[0]
    const teacherUser = users.find(u => !u.Staff?.[0]?.Role?.is_leadership) || users[1]
    const adminStaff = adminUser.Staff?.[0]
    const teacherStaff = teacherUser.Staff?.[0]
    
    if (adminStaff && teacherStaff) {
      return { adminUser, teacherUser, adminStaff, teacherStaff }
    }
  }
  
  throw new Error('Test database should have been seeded with data from main database')
}

export async function disconnectTestDatabase() {
  if (prisma) {
    await prisma.$disconnect()
  }
}

// Transaction wrapper for tests
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getTestPrismaClient()
  
  return prisma.$transaction(async (tx) => {
    await fn(tx as PrismaClient)
    throw new Error('Rollback') // Force rollback
  }).catch((error) => {
    if (error.message === 'Rollback') {
      return undefined as T
    }
    throw error
  })
}

// Helper to create isolated test context
export async function createTestContext() {
  await resetTestDatabase()
  const seededData = await seedTestDatabase()
  const factory = getTestFactory()
  
  return {
    prisma: getTestPrismaClient(),
    factory,
    ...seededData,
    cleanup: async () => {
      await resetTestDatabase()
    }
  }
}
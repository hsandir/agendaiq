import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { TestFactory } from '../fixtures/factory'

let prisma: PrismaClient

export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL?.replace(
      /\/agendaiq(\?.*)?$/,
      '/agendaiq_test$1'
    )

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
    prisma.meetingActionItems.deleteMany(),
    prisma.agendaItemComment.deleteMany(),
    prisma.agendaItemAttachment.deleteMany(),
    prisma.meetingAgendaItems.deleteMany(),
    prisma.meeting.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.staff.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
    prisma.department.deleteMany(),
    prisma.school.deleteMany(),
    prisma.district.deleteMany(),
  ])
}

export async function seedTestDatabase() {
  const factory = getTestFactory()
  
  // Create basic roles
  const adminRole = await factory['getOrCreateRole']('Administrator')
  const teacherRole = await factory['getOrCreateRole']('Teacher')
  
  // Create test users
  const adminUser = await factory.createUser({
    email: 'admin@test.com',
    name: 'Test Admin',
  })
  
  const teacherUser = await factory.createUser({
    email: 'teacher@test.com',
    name: 'Test Teacher',
  })
  
  // Create staff records
  const adminStaff = await factory.createStaff({
    user: adminUser,
    role: adminRole,
  })
  
  const teacherStaff = await factory.createStaff({
    user: teacherUser,
    role: teacherRole,
  })
  
  return { adminUser, teacherUser, adminStaff, teacherStaff }
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
    const result = await fn(tx as PrismaClient)
    throw new Error('Rollback') // Force rollback
  }).catch((error) => {
    if (error.message === 'Rollback') {
      return error.result
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
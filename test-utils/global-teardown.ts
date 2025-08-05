import { PrismaClient } from '@prisma/client'

export default async function globalTeardown() {
  console.log('\n🧹 Starting global test teardown...')

  const testDbUrl = process.env.DATABASE_URL?.replace(
    /\/agendaiq(\?.*)?$/,
    '/agendaiq_test$1'
  )

  if (!testDbUrl) {
    console.warn('⚠️ DATABASE_URL not set, skipping teardown')
    return
  }

  try {
    const prisma = new PrismaClient({
      datasources: {
        db: { url: testDbUrl }
      }
    })

    // Clean up test data
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

    await prisma.$disconnect()
    console.log('✅ Global teardown completed!\n')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
  }
}
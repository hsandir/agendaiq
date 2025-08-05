import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') })

export default async function globalSetup() {
  console.log('\n🚀 Starting global test setup...')

  // Set test database URL
  const testDbUrl = process.env.DATABASE_URL?.replace(
    /\/agendaiq(\?.*)?$/,
    '/agendaiq_test$1'
  )
  
  if (!testDbUrl) {
    throw new Error('DATABASE_URL not set')
  }

  process.env.DATABASE_URL = testDbUrl
  process.env.NODE_ENV = 'test'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.NEXTAUTH_SECRET = 'test-secret'

  try {
    // Create test database if it doesn't exist
    console.log('📦 Creating test database...')
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit'
    })

    // Run migrations
    console.log('🔄 Running migrations...')
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit'
    })

    // Seed test data
    console.log('🌱 Seeding test data...')
    const prisma = new PrismaClient({
      datasources: {
        db: { url: testDbUrl }
      }
    })

    await seedTestData(prisma)
    await prisma.$disconnect()

    console.log('✅ Global setup completed!\n')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  }
}

async function seedTestData(prisma: PrismaClient) {
  // Clear existing data
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

  // Create test district
  const district = await prisma.district.create({
    data: {
      name: 'Test District',
      code: 'TD001',
      address: '123 Test St',
      phone: '1234567890',
      email: 'test@district.edu',
      is_active: true,
    }
  })

  // Create test school
  const school = await prisma.school.create({
    data: {
      name: 'Test School',
      code: 'TS001',
      district_id: district.id,
      address: '456 School Ave',
      phone: '0987654321',
      email: 'test@school.edu',
      principal_name: 'Test Principal',
      vice_principal_name: 'Test VP',
      is_active: true,
    }
  })

  // Create test department
  const department = await prisma.department.create({
    data: {
      name: 'Test Department',
      code: 'DEPT001',
      school_id: school.id,
      description: 'Test department for testing',
      is_active: true,
    }
  })

  // Create roles
  const roles = await prisma.role.createMany({
    data: [
      { title: 'Administrator', is_leadership: true, priority: 1 },
      { title: 'Principal', is_leadership: true, priority: 3 },
      { title: 'Teacher', is_leadership: false, priority: 6 },
      { title: 'Staff', is_leadership: false, priority: 7 },
    ]
  })

  const adminRole = await prisma.role.findFirst({ where: { title: 'Administrator' } })
  const teacherRole = await prisma.role.findFirst({ where: { title: 'Teacher' } })

  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Test Admin',
      password: '$2a$10$test.hashed.password', // "password123"
      emailVerified: true,
      is_active: true,
      Staff: {
        create: {
          role_id: adminRole!.id,
          department_id: department.id,
          school_id: school.id,
          district_id: district.id,
          employee_number: 'EMP001',
          hire_date: new Date(),
          phone: '1111111111',
          is_active: true,
        }
      }
    },
    include: { Staff: true }
  })

  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@test.com',
      name: 'Test Teacher',
      password: '$2a$10$test.hashed.password',
      emailVerified: true,
      is_active: true,
      Staff: {
        create: {
          role_id: teacherRole!.id,
          department_id: department.id,
          school_id: school.id,
          district_id: district.id,
          employee_number: 'EMP002',
          hire_date: new Date(),
          phone: '2222222222',
          is_active: true,
        }
      }
    },
    include: { Staff: true }
  })

  console.log('✅ Test data seeded successfully')
}
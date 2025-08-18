// Create a test user for authentication testing
import { prisma } from '../src/lib/prisma';
import * as bcrypt from 'bcryptjs';

async function createTestUser() {
  const email = 'test@agendaiq.com';
  const password = 'TestUser2024!';
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('User already exists, updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { hashedPassword }
      });
      
      console.log('✅ Password updated for:', email);
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          hashedPassword,
          name: 'Test User Admin',
          emailVerified: new Date(),
          two_factor_enabled: false,
          backup_codes: [],
          theme_preference: 'standard',
          layout_preference: 'modern',
          login_notifications_enabled: true,
          suspicious_alerts_enabled: true,
          remember_devices_enabled: true,
          is_admin: true,
          is_system_admin: true,
          is_school_admin: true
        }
      });
      
      console.log('✅ User created:', user.email);
      
      // Create staff record if needed
      const role = await prisma.role.findFirst({
        where: { title: 'Administrator' }
      });
      
      if (role) {
        // Find or create a department
        let department = await prisma.department.findFirst();
        if (!department) {
          // Create a default district and school first
          const district = await prisma.district.create({
            data: {
              name: 'Test District',
              code: 'TD001'
            }
          });
          
          const school = await prisma.school.create({
            data: {
              name: 'Test School',
              district_id: district.id,
              code: 'TS001'
            }
          });
          
          department = await prisma.department.create({
            data: {
              name: 'Administration',
              school_id: school.id,
              code: 'ADM001'
            }
          });
        }
        
        // Get school and district info
        const schoolInfo = await prisma.school.findUnique({
          where: { id: department.school_id },
          include: { District: true }
        });
        
        if (!schoolInfo?.district_id) {
          throw new Error('School must have a valid district_id');
        }
        
        // Check if staff already exists for this user
        const existingStaff = await prisma.staff.findFirst({
          where: { user_id: user.id }
        });
        
        if (existingStaff) {
          console.log('Staff record already exists, updating...');
          await prisma.staff.update({
            where: { id: existingStaff.id },
            data: {
              role_id: role.id,
              department_id: department.id,
              school_id: department.school_id,
              district_id: schoolInfo.district_id,
              flags: ['active', 'verified'],
              endorsements: ['leadership', 'meeting_organizer'],
              extension: '1001',
              room: '101',
              is_active: true,
              hire_date: new Date('2020-01-01')
            }
          });
        } else {
          await prisma.staff.create({
            data: {
              user_id: user.id,
              role_id: role.id,
              department_id: department.id,
              school_id: department.school_id,
              district_id: schoolInfo.district_id,
              flags: ['active', 'verified'],
              endorsements: ['leadership', 'meeting_organizer'],
              extension: '1001',
              room: '101',
              is_active: true,
              hire_date: new Date('2020-01-01')
            }
          });
        }
        
        console.log('✅ Staff record created with role:', role.title);
      }
    }
    
    console.log('\n📝 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nYou can now login with these credentials!');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
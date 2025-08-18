// Create a test user for authentication testing
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  const email = 'test@example.com';
  const password = 'Test123456!';
  
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
          name: 'Test User',
          emailVerified: new Date(),
          two_factor_enabled: false,
          backup_codes: []
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
              school_code: 'TS001'
            }
          });
          
          department = await prisma.department.create({
            data: {
              name: 'Administration',
              school_id: school.id
            }
          });
        }
        
        const staff = await prisma.staff.create({
          data: {
            user_id: user.id,
            role_id: role.id,
            department_id: department.id,
            school_id: department.school_id,
            district_id: department.School?.district_id || null,
            flags: [],
            endorsements: []
          }
        });
        
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
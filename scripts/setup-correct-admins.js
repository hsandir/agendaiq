const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setupCorrectAdmins() {
  console.log('🔧 Setting up correct admin roles...\n');
  
  try {
    // 1. Setup admin@school.edu as Development System Administrator
    console.log('📧 Setting up admin@school.edu as Development System Administrator...');
    
    let devAdmin = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (!devAdmin) {
      const hashedPassword = await bcrypt.hash('1234', 10);
      devAdmin = await prisma.user.create({
        data: {
          email: 'admin@school.edu',
          name: 'Development Admin',
          hashedPassword: hashedPassword,
          is_admin: true,
          is_system_admin: true,   // System administrator
          is_school_admin: false,  // Not school admin
          emailVerified: new Date()
        }
      });
      console.log('✅ Created admin@school.edu');
    } else {
      // Update existing user
      await prisma.user.update({
        where: { id: devAdmin.id },
        data: {
          name: 'Development Admin',
          is_system_admin: true,
          is_school_admin: false
        }
      });
      console.log('✅ Updated admin@school.edu');
    }
    
    // 2. Setup sysadmin@cjcollegeprep.org as School Administrator
    console.log('\n📧 Setting up sysadmin@cjcollegeprep.org as School Administrator...');
    
    let schoolAdmin = await prisma.user.findUnique({
      where: { email: 'sysadmin@cjcollegeprep.org' }
    });
    
    if (!schoolAdmin) {
      const hashedPassword = await bcrypt.hash('Admin123!@#', 10);
      schoolAdmin = await prisma.user.create({
        data: {
          email: 'sysadmin@cjcollegeprep.org',
          name: 'School System Administrator',
          hashedPassword: hashedPassword,
          is_admin: true,
          is_system_admin: false,  // Not system admin
          is_school_admin: true,   // School admin only
          emailVerified: new Date()
        }
      });
      console.log('✅ Created sysadmin@cjcollegeprep.org');
    } else {
      // Update existing user
      await prisma.user.update({
        where: { id: schoolAdmin.id },
        data: {
          name: 'School System Administrator',
          is_system_admin: false,
          is_school_admin: true
        }
      });
      console.log('✅ Updated sysadmin@cjcollegeprep.org');
    }
    
    // 3. Create staff records if needed
    console.log('\n📋 Checking staff records...');
    
    // Get role IDs
    const adminRole = await prisma.role.findFirst({
      where: { title: 'Administrator' }
    });
    
    const systemAdminRole = await prisma.role.findFirst({
      where: { title: 'System Administrator' }
    });
    
    // Get organization IDs
    const district = await prisma.district.findFirst();
    const school = await prisma.school.findFirst();
    const department = await prisma.department.findFirst({
      where: { code: 'ADMIN' }
    }) || await prisma.department.findFirst();
    
    // Create staff for devAdmin if needed
    const devAdminStaff = await prisma.staff.findFirst({
      where: { user_id: devAdmin.id }
    });
    
    if (!devAdminStaff && adminRole && district && school && department) {
      await prisma.staff.create({
        data: {
          first_name: 'Development',
          last_name: 'Admin',
          email: 'admin@school.edu',
          user_id: devAdmin.id,
          role_id: adminRole.id,
          department_id: department.id,
          school_id: school.id,
          district_id: district.id,
          enrollment_date: new Date(),
          is_active: true
        }
      });
      console.log('✅ Created staff record for admin@school.edu');
    }
    
    // Create staff for schoolAdmin if needed
    const schoolAdminStaff = await prisma.staff.findFirst({
      where: { user_id: schoolAdmin.id }
    });
    
    if (!schoolAdminStaff && systemAdminRole && district && school && department) {
      await prisma.staff.create({
        data: {
          first_name: 'System',
          last_name: 'Administrator',
          email: 'sysadmin@cjcollegeprep.org',
          user_id: schoolAdmin.id,
          role_id: systemAdminRole.id,
          department_id: department.id,
          school_id: school.id,
          district_id: district.id,
          enrollment_date: new Date(),
          is_active: true
        }
      });
      console.log('✅ Created staff record for sysadmin@cjcollegeprep.org');
    }
    
    // 4. Verify final state
    console.log('\n📊 Final Admin Configuration:');
    console.log('='.repeat(50));
    
    const admins = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@school.edu', 'sysadmin@cjcollegeprep.org']
        }
      },
      select: {
        email: true,
        name: true,
        is_system_admin: true,
        is_school_admin: true,
        Staff: {
          select: {
            Role: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });
    
    for (const admin of admins) {
      console.log(`\n${admin.email}:`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  System Admin: ${admin.is_system_admin ? '✅' : '❌'}`);
      console.log(`  School Admin: ${admin.is_school_admin ? '✅' : '❌'}`);
      if (admin.Staff[0]) {
        console.log(`  Role: ${admin.Staff[0].Role.title}`);
      }
    }
    
    console.log('\n✨ Admin setup completed successfully!');
    console.log('\nLogin Credentials:');
    console.log('  Development Admin: admin@school.edu / 1234');
    console.log('  School Admin: sysadmin@cjcollegeprep.org / Admin123!@#');
    
  } catch (error) {
    console.error('❌ Error setting up admins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupCorrectAdmins().catch(console.error);
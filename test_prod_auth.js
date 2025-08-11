const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function testAuth() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
      }
    }
  });

  try {
    console.log('Testing NextAuth flow for admin@school.edu...\n');
    
    // 1. Find user exactly as NextAuth does
    const user = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
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
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Name:', user.name);
    console.log('- Has password:', !!user.hashedPassword);
    console.log('- Email verified:', !!user.emailVerified);
    console.log('- Staff count:', user.Staff.length);
    
    // 2. Test password
    if (!user.hashedPassword) {
      console.log('❌ No password hash');
      return;
    }
    
    const isValid = await bcrypt.compare('1234', user.hashedPassword);
    console.log('\n✅ Password "1234" is valid:', isValid);
    
    // 3. Check Staff data structure
    const staff = user.Staff[0];
    if (!staff) {
      console.log('\n⚠️  No staff entry found');
      console.log('This might be causing the issue!');
      
      // Try to create staff entry
      const role = await prisma.role.findFirst({
        where: {
          OR: [
            { title: 'Development Admin' },
            { title: 'System Administrator' }
          ]
        }
      });
      
      const district = await prisma.district.findFirst();
      const school = await prisma.school.findFirst();
      const department = await prisma.department.findFirst();
      
      if (role && district && school && department) {
        console.log('\nCreating staff entry...');
        const newStaff = await prisma.staff.create({
          data: {
            user_id: user.id,
            first_name: 'System',
            last_name: 'Administrator',
            email: 'admin@school.edu',
            phone: '555-0000',
            role_id: role.id,
            district_id: district.id,
            school_id: school.id,
            department_id: department.id,
            is_active: true
          }
        });
        console.log('✅ Staff entry created with ID:', newStaff.id);
      }
    } else {
      console.log('\n✅ Staff entry exists:');
      console.log('- Staff ID:', staff.id);
      console.log('- Role:', staff.Role?.title);
      console.log('- Department:', staff.Department?.name);
      console.log('- School:', staff.School?.name);
      console.log('- District:', staff.District?.name);
      
      // Check if all required fields exist
      if (!staff.Role) console.log('⚠️  Missing Role');
      if (!staff.Department) console.log('⚠️  Missing Department');
      if (!staff.School) console.log('⚠️  Missing School');
      if (!staff.District) console.log('⚠️  Missing District');
    }
    
    // 4. Build userData object as NextAuth does
    const userData = {
      id: String(user.id),
      email: user.email,
      name: user.name || user.email,
      ...(staff && {
        staff: {
          id: staff.id,
          role: staff.Role ? {
            id: staff.Role.id,
            title: staff.Role.title,
            priority: staff.Role.priority,
            category: staff.Role.category,
            is_leadership: staff.Role.is_leadership
          } : null,
          department: staff.Department ? {
            id: staff.Department.id,
            name: staff.Department.name,
            code: staff.Department.code
          } : null,
          school: staff.School ? {
            id: staff.School.id,
            name: staff.School.name,
            code: staff.School.code
          } : null,
          district: staff.District ? {
            id: staff.District.id,
            name: staff.District.name,
            code: staff.District.code
          } : null
        }
      })
    };
    
    console.log('\n✅ UserData object would be:');
    console.log(JSON.stringify(userData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
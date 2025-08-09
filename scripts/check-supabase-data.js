/**
 * Check Supabase data to find real production data
 */
const { PrismaClient } = require('@prisma/client');

// First set environment variables for Supabase
process.env.DATABASE_URL = "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
process.env.DIRECT_URL = "postgresql://postgres:s%3Fr%26v6vXSCEc_8A@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres";

// Use Supabase connection
const supabasePrisma = new PrismaClient();

async function checkSupabaseData() {
  console.log('🔍 Checking Supabase for real data...\n');
  
  try {
    // Count all entities
    const [users, staff, departments, schools, districts, roles, meetings] = await Promise.all([
      supabasePrisma.user.count(),
      supabasePrisma.staff.count(),
      supabasePrisma.department.count(),
      supabasePrisma.school.count(),
      supabasePrisma.district.count(),
      supabasePrisma.role.count(),
      supabasePrisma.meeting.count()
    ]).catch(e => {
      console.error('Error counting:', e.message);
      return [0, 0, 0, 0, 0, 0, 0];
    });
    
    console.log('📊 Supabase Database Status:');
    console.log('✅ Users:', users);
    console.log('✅ Staff:', staff);
    console.log('✅ Departments:', departments);
    console.log('✅ Schools:', schools);
    console.log('✅ Districts:', districts);
    console.log('✅ Roles:', roles);
    console.log('✅ Meetings:', meetings);
    
    if (users > 0) {
      // Get some sample users
      const userList = await supabasePrisma.user.findMany({
        select: { id: true, email: true, name: true },
        take: 10
      });
      
      console.log('\n👥 Sample Users from Supabase:');
      userList.forEach(u => console.log(`  - ${u.email} (${u.name || 'No name'})`));
    }
    
    if (roles > 0) {
      // Get all roles
      const roleList = await supabasePrisma.role.findMany({
        select: { id: true, title: true, priority: true },
        orderBy: { priority: 'asc' }
      });
      
      console.log('\n👔 All Roles from Supabase:');
      roleList.forEach(r => console.log(`  - ${r.title} (Priority: ${r.priority})`));
    }
    
    await supabasePrisma.$disconnect();
    
    if (users === 0) {
      console.log('\n⚠️ Supabase appears to be empty. Checking local database...');
      
      // Check local database
      const localPrisma = new PrismaClient();
      const localUsers = await localPrisma.user.count();
      const localRoles = await localPrisma.role.count();
      
      console.log('\n📊 Local Database Status:');
      console.log('✅ Users:', localUsers);
      console.log('✅ Roles:', localRoles);
      
      await localPrisma.$disconnect();
    }
    
  } catch (error) {
    console.error('❌ Error checking Supabase:', error.message);
    
    // Try with password in URL
    console.log('\n🔄 Trying with password in connection string...');
    
    const supabasePrismaWithPassword = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres.tvhqasooledcffwogbvd:s%3Fr%26v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
        }
      }
    });
    
    try {
      const userCount = await supabasePrismaWithPassword.user.count();
      console.log('✅ Connected to Supabase! Users:', userCount);
      
      if (userCount > 0) {
        const users = await supabasePrismaWithPassword.user.findMany({
          select: { id: true, email: true, name: true },
          take: 10
        });
        
        console.log('\n👥 Users found in Supabase:');
        users.forEach(u => console.log(`  - ${u.email} (${u.name || 'No name'})`));
      }
      
      await supabasePrismaWithPassword.$disconnect();
    } catch (e2) {
      console.error('❌ Still cannot connect:', e2.message);
    }
  }
}

checkSupabaseData();
/**
 * Copy data from production database to v2 database
 * This script copies existing data to v2 for testing
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaClient: PrismaClientV2 } = require('@prisma/client-v2');

const prisma = new PrismaClient();
const prismaV2 = new PrismaClientV2();

async function copyData() {
  try {
    console.log('🔄 Starting data copy from production to v2...');

    // 1. Copy Users
    console.log('📋 Copying users...');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      try {
        await prismaV2.user.upsert({
          where: { id: user.id },
          update: {},
          create: user
        });
      } catch (err) {
        console.log(`Skipping user ${user.id}: ${err.message}`);
      }
    }

    // 2. Copy Districts
    console.log('📋 Copying districts...');
    const districts = await prisma.district.findMany();
    console.log(`Found ${districts.length} districts`);
    
    for (const district of districts) {
      try {
        await prismaV2.district.upsert({
          where: { id: district.id },
          update: {},
          create: district
        });
      } catch (err) {
        console.log(`Skipping district ${district.id}: ${err.message}`);
      }
    }

    // 3. Copy Schools
    console.log('📋 Copying schools...');
    const schools = await prisma.school.findMany();
    console.log(`Found ${schools.length} schools`);
    
    for (const school of schools) {
      try {
        await prismaV2.school.upsert({
          where: { id: school.id },
          update: {},
          create: school
        });
      } catch (err) {
        console.log(`Skipping school ${school.id}: ${err.message}`);
      }
    }

    // 4. Copy Departments
    console.log('📋 Copying departments...');
    const departments = await prisma.department.findMany();
    console.log(`Found ${departments.length} departments`);
    
    for (const department of departments) {
      try {
        await prismaV2.department.upsert({
          where: { id: department.id },
          update: {},
          create: department
        });
      } catch (err) {
        console.log(`Skipping department ${department.id}: ${err.message}`);
      }
    }

    // 5. Copy Roles
    console.log('📋 Copying roles...');
    const roles = await prisma.role.findMany();
    console.log(`Found ${roles.length} roles`);
    
    for (const role of roles) {
      try {
        await prismaV2.role.upsert({
          where: { id: role.id },
          update: {},
          create: role
        });
      } catch (err) {
        console.log(`Skipping role ${role.id}: ${err.message}`);
      }
    }

    // 6. Copy Staff
    console.log('📋 Copying staff...');
    const staff = await prisma.staff.findMany();
    console.log(`Found ${staff.length} staff`);
    
    for (const staffMember of staff) {
      try {
        await prismaV2.staff.upsert({
          where: { id: staffMember.id },
          update: {},
          create: staffMember
        });
      } catch (err) {
        console.log(`Skipping staff ${staffMember.id}: ${err.message}`);
      }
    }

    // 7. Copy Meetings (optional, for team association)
    console.log('📋 Copying meetings...');
    const meetings = await prisma.meeting.findMany({
      take: 100 // Limit to recent meetings
    });
    console.log(`Found ${meetings.length} meetings (limited to 100)`);
    
    for (const meeting of meetings) {
      try {
        await prismaV2.meeting.upsert({
          where: { id: meeting.id },
          update: {},
          create: {
            ...meeting,
            team_id: null // No team association yet
          }
        });
      } catch (err) {
        console.log(`Skipping meeting ${meeting.id}: ${err.message}`);
      }
    }

    console.log('✅ Data copy completed!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Districts: ${districts.length}`);
    console.log(`- Schools: ${schools.length}`);
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Roles: ${roles.length}`);
    console.log(`- Staff: ${staff.length}`);
    console.log(`- Meetings: ${meetings.length}`);

  } catch (error) {
    console.error('❌ Error copying data:', error);
  } finally {
    await prisma.$disconnect();
    await prismaV2.$disconnect();
  }
}

// Run the script
copyData();
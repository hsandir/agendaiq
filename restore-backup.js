const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://hs:yeni@localhost:5432/agendaiq"
    }
  }
});

async function restoreBackup() {
  try {
    // Read backup file
    const backupData = JSON.parse(
      fs.readFileSync('./backups/2025-08-09T07-04-04-465Z/database-backup.json', 'utf8')
    );

    console.log('Starting backup restore...');

    // Clear existing data (in order to respect foreign keys)
    await prisma.meetingActionItem.deleteMany();
    await prisma.meetingAgendaItem.deleteMany();
    await prisma.meetingNote.deleteMany();
    await prisma.meetingAttendee.deleteMany();
    await prisma.meeting.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.department.deleteMany();
    await prisma.school.deleteMany();
    await prisma.district.deleteMany();

    console.log('Existing data cleared');

    // Restore districts
    if (backupData.district && backupData.district.length > 0) {
      for (const district of backupData.district) {
        await prisma.district.create({
          data: {
            id: district.id,
            name: district.name,
            code: district.code || null,
            address: district.address || null,
            created_at: new Date(district.created_at)
          }
        });
      }
      console.log(`Restored ${backupData.district.length} districts`);
    }

    // Restore schools
    if (backupData.school && backupData.school.length > 0) {
      for (const school of backupData.school) {
        await prisma.school.create({
          data: {
            id: school.id,
            name: school.name,
            code: school.code || null,
            district_id: school.district_id,
            created_at: new Date(school.created_at)
          }
        });
      }
      console.log(`Restored ${backupData.school.length} schools`);
    }

    // Restore departments
    if (backupData.department && backupData.department.length > 0) {
      for (const dept of backupData.department) {
        // Skip if school doesn't exist
        const school = await prisma.school.findUnique({
          where: { id: dept.school_id }
        });
        if (!school) {
          console.log(`Skipping department ${dept.name} - school ${dept.school_id} not found`);
          continue;
        }
        
        await prisma.department.create({
          data: {
            id: dept.id,
            name: dept.name,
            code: dept.code || null,
            school_id: dept.school_id,
            category: dept.category || null,
            level: dept.level || null,
            parent_id: dept.parent_id || null,
            created_at: new Date(dept.created_at)
          }
        });
      }
      console.log(`Restored ${backupData.department.length} departments`);
    }

    // Restore roles
    if (backupData.role && backupData.role.length > 0) {
      for (const role of backupData.role) {
        await prisma.role.create({
          data: {
            id: role.id,
            title: role.title,
            key: role.key || null,
            priority: role.priority,
            is_leadership: role.is_leadership,
            is_coordinator: role.is_coordinator || false,
            is_supervisor: role.is_supervisor || false,
            level: role.level || null,
            category: role.category || null,
            extension: role.extension || null,
            room: role.room || null,
            department_id: role.department_id || null,
            parent_id: role.parent_id || null,
            created_at: new Date(role.created_at)
          }
        });
      }
      console.log(`Restored ${backupData.role.length} roles`);
    }

    // Restore users
    if (backupData.user && backupData.user.length > 0) {
      for (const user of backupData.user) {
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            staff_id: user.staff_id || null,
            hashedPassword: user.hashedPassword,
            emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
            image: user.image || null,
            is_admin: user.is_admin || false,
            is_system_admin: user.is_system_admin || false,
            is_school_admin: user.is_school_admin || false,
            two_factor_enabled: user.two_factor_enabled || false,
            two_factor_secret: user.two_factor_secret || null,
            backup_codes: user.backup_codes || [],
            login_notifications_enabled: user.login_notifications_enabled !== false,
            suspicious_alerts_enabled: user.suspicious_alerts_enabled !== false,
            remember_devices_enabled: user.remember_devices_enabled !== false,
            created_at: new Date(user.created_at),
            updated_at: new Date(user.updated_at),
            theme_preference: user.theme_preference || null,
            layout_preference: user.layout_preference || null,
            custom_theme: user.custom_theme || null
          }
        });
      }
      console.log(`Restored ${backupData.user.length} users`);
    }

    // Restore staff
    if (backupData.staff && backupData.staff.length > 0) {
      for (const staff of backupData.staff) {
        await prisma.staff.create({
          data: {
            id: staff.id,
            user_id: staff.user_id,
            role_id: staff.role_id,
            department_id: staff.department_id,
            school_id: staff.school_id,
            district_id: staff.district_id,
            manager_id: staff.manager_id || null,
            flags: staff.flags || [],
            endorsements: staff.endorsements || [],
            is_active: staff.is_active !== false,
            extension: staff.extension || null,
            room: staff.room || null,
            created_at: new Date(staff.created_at)
          }
        });
      }
      console.log(`Restored ${backupData.staff.length} staff`);
    }

    // Restore meetings if any
    if (backupData.meeting && backupData.meeting.length > 0) {
      for (const meeting of backupData.meeting) {
        await prisma.meeting.create({
          data: {
            id: meeting.id,
            title: meeting.title,
            description: meeting.description || null,
            start_time: new Date(meeting.start_time),
            end_time: new Date(meeting.end_time),
            meeting_type: meeting.meeting_type || 'regular',
            status: meeting.status || 'draft',
            organizer_id: meeting.organizer_id,
            department_id: meeting.department_id,
            school_id: meeting.school_id,
            district_id: meeting.district_id,
            created_at: new Date(meeting.created_at),
            updated_at: new Date(meeting.updated_at)
          }
        });
      }
      console.log(`Restored ${backupData.meeting.length} meetings`);
    }

    // Update sequences
    await prisma.$executeRaw`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`;
    await prisma.$executeRaw`SELECT setval('"District_id_seq"', (SELECT MAX(id) FROM "District"));`;
    await prisma.$executeRaw`SELECT setval('"School_id_seq"', (SELECT MAX(id) FROM "School"));`;
    await prisma.$executeRaw`SELECT setval('"Department_id_seq"', (SELECT MAX(id) FROM "Department"));`;
    await prisma.$executeRaw`SELECT setval('"Role_id_seq"', (SELECT MAX(id) FROM "Role"));`;
    await prisma.$executeRaw`SELECT setval('"Staff_id_seq"', (SELECT MAX(id) FROM "Staff"));`;
    await prisma.$executeRaw`SELECT setval('"Meeting_id_seq"', (SELECT MAX(id) FROM "Meeting"));`;

    console.log('✅ Backup restore completed successfully!');

    // Verify restore
    const counts = {
      users: await prisma.user.count(),
      staff: await prisma.staff.count(),
      roles: await prisma.role.count(),
      departments: await prisma.department.count(),
      schools: await prisma.school.count(),
      districts: await prisma.district.count(),
      meetings: await prisma.meeting.count()
    };

    console.log('Final counts:', counts);

  } catch (error) {
    console.error('Error restoring backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreBackup();
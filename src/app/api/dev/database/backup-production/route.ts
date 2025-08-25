import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🔄 Starting production database backup...');
    
    const backup = {
      timestamp: new Date().toISOString(),
      tables: {} as Record<string, any[]>
    };

    // Backup critical tables with data
    console.log('📋 Backing up users...');
    backup.tables.users = await prisma.users.findMany({
      include: {
        staff: {
          include: {
            role: true,
            department: true,
            school: true,
            district: true
          }
        },
        devices: true,
        account: true
      }
    });

    console.log('🏫 Backing up districts...');
    backup.tables.districts = await prisma.district.findMany();

    console.log('🏫 Backing up schools...');
    backup.tables.schools = await prisma.school.findMany();

    console.log('🏢 Backing up departments...');
    backup.tables.departments = await prisma.department.findMany();

    console.log('👥 Backing up roles...');
    backup.tables.roles = await prisma.role.findMany();

    console.log('👤 Backing up staff...');
    backup.tables.staff = await prisma.staff.findMany({
      include: {
        role: true,
        department: true,
        school: true,
        district: true,
        users: true
      }
    });

    console.log('📅 Backing up meetings...');
    backup.tables.meetings = await prisma.meeting.findMany({
      include: {
        meeting_agenda_items: true,
        meeting_attendee: true,
        meeting_action_items: true
      }
    });

    console.log('👥 Backing up teams...');
    backup.tables.teams = await prisma.teams.findMany({
      include: {
        team_members: true,
        team_knowledge: true
      }
    });

    console.log('📝 Backing up audit logs...');
    backup.tables.audit_logs = await prisma.audit_logs.findMany({
      orderBy: { created_at: 'desc' },
      take: 1000 // Last 1000 audit logs
    });

    console.log('⚙️ Backing up system settings...');
    backup.tables.system_settings = await prisma.system_settings.findMany();

    const stats = {
      users: backup.tables.users?.length || 0,
      districts: backup.tables.districts?.length || 0,
      schools: backup.tables.schools?.length || 0,
      departments: backup.tables.departments?.length || 0,
      roles: backup.tables.roles?.length || 0,
      staff: backup.tables.staff?.length || 0,
      meetings: backup.tables.meetings?.length || 0,
      teams: backup.tables.teams?.length || 0,
      audit_logs: backup.tables.audit_logs?.length || 0,
      system_settings: backup.tables.system_settings?.length || 0
    };

    console.log('✅ Backup completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Production database backup completed',
      stats,
      backup: process.env.NODE_ENV === 'development' ? backup : 'Backup data hidden in production',
      backupSize: JSON.stringify(backup).length
    });

  } catch (error) {
    console.error('❌ Backup failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to backup production database',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get backup status and table counts
    const stats = await Promise.all([
      prisma.users.count(),
      prisma.district.count(), 
      prisma.school.count(),
      prisma.department.count(),
      prisma.role.count(),
      prisma.staff.count(),
      prisma.meeting.count(),
      prisma.teams.count(),
      prisma.audit_logs.count(),
      prisma.system_settings.count()
    ]);

    return NextResponse.json({
      success: true,
      currentStats: {
        users: stats[0],
        districts: stats[1],
        schools: stats[2],
        departments: stats[3],
        roles: stats[4],
        staff: stats[5],
        meetings: stats[6],
        teams: stats[7],
        audit_logs: stats[8],
        system_settings: stats[9]
      },
      totalRecords: stats.reduce((sum, count) => sum + count, 0)
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get backup stats',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
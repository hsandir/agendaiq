import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Get actual table count from database
    const tableCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    const tableCount = Number(tableCountResult[0]?.count || 0);
    
    // Get total record counts with error handling
    let totalRecords = 0;
    
    try {
      // Count records in main tables
      const counts = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.staff.count().catch(() => 0),
        prisma.school.count().catch(() => 0),
        prisma.district.count().catch(() => 0),
        prisma.meeting.count().catch(() => 0),
        prisma.meetingAgendaItem.count().catch(() => 0),
        prisma.auditLog.count().catch(() => 0),
        prisma.role.count().catch(() => 0),
        prisma.department.count().catch(() => 0),
      ]);
      
      totalRecords = counts.reduce((sum, count) => sum + count, 0);
    } catch (error: unknown) {
      console.error('Error counting records:', error);
    }

    return NextResponse.json({
      tables: tableCount || 24, // Fallback to known table count
      records: totalRecords
    });
  } catch (error: unknown) {
    console.error('Failed to fetch database stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database stats' },
      { status: 500 }
    );
  }
}
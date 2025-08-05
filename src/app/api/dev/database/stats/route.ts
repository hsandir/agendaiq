import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireStaffRole: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Get table count from Prisma models
    const modelNames = Object.keys(prisma).filter(key => 
      !key.startsWith('$') && !key.startsWith('_')
    );
    
    // Get total record counts
    let totalRecords = 0;
    
    // Count records in main tables
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.staff.count(),
      prisma.school.count(),
      prisma.district.count(),
      prisma.meeting.count(),
      prisma.agendaItem.count(),
      prisma.auditLog.count(),
    ]);
    
    totalRecords = counts.reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      tables: modelNames.length || 24, // Fallback to known table count
      records: totalRecords
    });
  } catch (error) {
    console.error('Failed to fetch database stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database stats' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { AuditLogger } from '@/lib/audit/audit-logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAdminRole: true });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;

    const summary = await AuditLogger.getAuditSummary(days);

    return NextResponse.json({
      success: true,
      data: summary,
      period: `${days} gün`
    });

  } catch (error) {
    console.error('Error fetching audit summary:', error);
    return NextResponse.json({
      error: 'Audit özet bilgileri alınırken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
} 
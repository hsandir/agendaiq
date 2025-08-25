import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { auditSystem } from '@/lib/audit/hybrid-audit-system';

export async function GET(request: NextRequest) {
  try {
    // Require operations admin access
    const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireCapability: Capability.USER_MANAGE });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const minRiskScore = parseInt(searchParams.get('minRiskScore') ?? '50');
    const hoursBack = parseInt(searchParams.get('hoursBack') ?? '24');
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));

    // Validate parameters
    if (minRiskScore < 0 || minRiskScore > 100) {
      return NextResponse.json({ error: 'minRiskScore must be between 0 and 100' }, { status: 400 });
    }

    if (hoursBack < 1 || hoursBack > 720) { // Max 30 days
      return NextResponse.json({ error: 'hoursBack must be between 1 and 720' }, { status: 400 });
    }

    // Get high risk events
    const highRiskEvents = await auditSystem.getHighRiskEvents(minRiskScore, hoursBack);

    // Calculate statistics
    const stats = {
      total: highRiskEvents.length,
      riskScoreDistribution: {} as Record<string, number>,
      categoryDistribution: {} as Record<string, number>,
      userDistribution: {} as Record<string, number>,
      ipDistribution: {} as Record<string, number>,
      timeRange: {
        from: new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }
    };

    // Calculate distributions
    highRiskEvents.forEach(event => {
      // Risk score distribution
      const riskRange = Math.floor((event.risk_score / 10)) * 10;
      const riskKey = `${riskRange}-${riskRange + 9}`;
      stats.riskScoreDistribution[riskKey] = (stats.riskScoreDistribution[riskKey] ?? 0) + 1;

      // Category distribution
      stats.categoryDistribution[event.category] = (stats.categoryDistribution[event.category] ?? 0) + 1;

      // User distribution (top 10)
      if (event.User?.email) {
        stats.userDistribution[event.User.email] = (stats.userDistribution[event.User.email] ?? 0) + 1;
      }

      // IP distribution (top 10)
      if (event.ip_address && event.ip_address !== 'unknown') {
        stats.ipDistribution[event.ip_address] = (stats.ipDistribution[event.ip_address] ?? 0) + 1;
      }
    });

    // Limit distributions to top entries
    stats.userDistribution = Object.fromEntries(
      Object.entries(stats.userDistribution)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
    );

    stats.ipDistribution = Object.fromEntries(
      Object.entries(stats.ipDistribution);
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10);
    );

    return NextResponse.json({
      events: highRiskEvents.slice(0, limit),
      stats,
      query: {
        minRiskScore,
        hoursBack,
        limit
      }
    });

  } catch (error: unknown) {
    console.error('High risk events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
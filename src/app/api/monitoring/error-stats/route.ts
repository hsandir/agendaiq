/**
 * Error Statistics API Route (Disabled)
 * Sentry subscription expired - returns empty stats
 * Following CLAUDE.md rules - Real-time data only
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    console.log('Monitoring API called (disabled): error-stats endpoint');

    // Sentry disabled - return no data structure
    return NextResponse.json({
      stats: {
        crashFreeUsers: null,
        crashFreeSessions: null,
        errorRate: null,
        activeIssues: 0,
        newIssues24h: 0,
        resolvedIssues24h: 0,
        p95ResponseTime: null,
        affectedUsers: 0
      },
      message: 'Error statistics disabled - Sentry subscription expired',
      status: 'disabled'
    });
    
  } catch (error: unknown) {
    console.error('Error stats API error:', error);
    
    // Log to console instead of Sentry
    console.error('Error in error stats API:', {
      component: 'error-stats-api',
      action: 'fetch-stats',
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Failed to fetch error statistics' },
      { status: 500 }
    );
  }
}
/**
 * Error Issues API Route (Disabled)
 * Sentry subscription expired - returns empty data
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

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level') ?? 'all';

    console.log(`Monitoring API called (disabled): errors endpoint, level=${level}`);

    // Sentry disabled - return empty data
    return NextResponse.json({
      issues: [],
      message: 'Error monitoring disabled - Sentry subscription expired',
      status: 'disabled'
    });
    
  } catch (error: unknown) {
    console.error('Error monitoring API error:', error);
    
    // Log to console instead of Sentry
    console.error('Error in monitoring API:', {
      component: 'error-monitoring-api',
      action: 'fetch-issues',
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Failed to fetch error issues' },
      { status: 500 }
    );
  }
}
/**
 * Release Health API Route (Disabled)
 * Sentry subscription expired - returns empty health data
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

    // Get current version info
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unknown';
    const releaseVersion = `${currentVersion}+${commitSha}`;

    console.log(`Monitoring API called (disabled): release-health endpoint for version ${releaseVersion}`);

    // Sentry disabled - return no data structure
    return NextResponse.json({
      release: {
        version: releaseVersion,
        adoptionRate: null,
        crashFreeRate: null,
        sessionCount: 0,
        errorCount: 0,
        newIssues: 0,
        status: 'unknown' as 'healthy' | 'degraded' | 'critical' | 'unknown'
      },
      message: 'Release health monitoring disabled - Sentry subscription expired',
      status: 'disabled'
    });
    
  } catch (error: unknown) {
    console.error('Release health API error:', error);
    
    // Log to console instead of Sentry
    console.error('Error in release health API:', {
      component: 'release-health-api',
      action: 'fetch-release',
      error: error instanceof Error ? error.message : String(error);
    });

    return NextResponse.json(
      { error: 'Failed to fetch release health' },
      { status: 500 }
    );
  }
}
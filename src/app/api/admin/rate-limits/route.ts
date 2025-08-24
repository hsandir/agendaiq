import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { handleRateLimitMonitoring, AdvancedRateLimiter } from '@/lib/utils/rate-limit-advanced';
import { z } from 'zod';

// Schema for updating rate limit configuration
const updateSchema = z.object({
  action: z.enum(['blacklist', 'whitelist', 'unblacklist', 'unwhitelist', 'clear-metrics']),
  ip: z.string().optional(),
});

// GET /api/admin/rate-limits - Get rate limiting metrics
export async function GET(request: NextRequest) {
  try {
    // Check authentication - operations admin only
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    // Return rate limiting metrics
    return await handleRateLimitMonitoring();
  } catch (error: unknown) {
    console.error('Error fetching rate limit metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch rate limit metrics',
        code: 'RATE_LIMIT_METRICS_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/rate-limits - Update rate limiting configuration
export async function POST(request: NextRequest) {
  try {
    // Check authentication - operations admin only
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { _action, _ip } = validation.data;

    // Get all rate limiter instances
    const rateLimiters = [
      'auth',
      'registration',
      'api',
      'passwordReset',
      'meetings',
      'uploads',
      'webhooks',
    ];

    switch (action) {
      case 'blacklist':
        if (!ip) {
          return NextResponse.json(
            { error: 'IP address required for blacklisting' },
            { status: 400 }
          );
        }
        
        // Add IP to all rate limiter blacklists
        for (const limiterName of rateLimiters) {
          const limiter = (await import('@/lib/utils/rate-limit-advanced')).EnhancedRateLimiters[
            limiterName as keyof typeof import('@/lib/utils/rate-limit-advanced').EnhancedRateLimiters
          ];
          limiter.addToBlacklist(ip);
        }
        
        return NextResponse.json({
          success: true,
          message: `IP ${ip} added to blacklist`,
        });

      case 'unblacklist':
        if (!ip) {
          return NextResponse.json(
            { error: 'IP address required for unblacklisting' },
            { status: 400 }
          );
        }
        
        // Remove IP from all rate limiter blacklists
        for (const limiterName of rateLimiters) {
          const limiter = (await import('@/lib/utils/rate-limit-advanced')).EnhancedRateLimiters[
            limiterName as keyof typeof import('@/lib/utils/rate-limit-advanced').EnhancedRateLimiters
          ];
          limiter.removeFromBlacklist(ip);
        }
        
        return NextResponse.json({
          success: true,
          message: `IP ${ip} removed from blacklist`,
        });

      case 'whitelist':
        if (!ip) {
          return NextResponse.json(
            { error: 'IP address required for whitelisting' },
            { status: 400 }
          );
        }
        
        // Add IP to all rate limiter whitelists
        for (const limiterName of rateLimiters) {
          const limiter = (await import('@/lib/utils/rate-limit-advanced')).EnhancedRateLimiters[
            limiterName as keyof typeof import('@/lib/utils/rate-limit-advanced').EnhancedRateLimiters
          ];
          limiter.addToWhitelist(ip);
        }
        
        return NextResponse.json({
          success: true,
          message: `IP ${ip} added to whitelist`,
        });

      case 'unwhitelist':
        if (!ip) {
          return NextResponse.json(
            { error: 'IP address required for unwhitelisting' },
            { status: 400 }
          );
        }
        
        // Remove IP from all rate limiter whitelists
        for (const limiterName of rateLimiters) {
          const limiter = (await import('@/lib/utils/rate-limit-advanced')).EnhancedRateLimiters[
            limiterName as keyof typeof import('@/lib/utils/rate-limit-advanced').EnhancedRateLimiters
          ];
          limiter.removeFromWhitelist(ip);
        }
        
        return NextResponse.json({
          success: true,
          message: `IP ${ip} removed from whitelist`,
        });

      case 'clear-metrics':
        AdvancedRateLimiter.clearMetrics();
        return NextResponse.json({
          success: true,
          message: 'Rate limit metrics cleared',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error('Error updating rate limit configuration:', error);
    return NextResponse.json(
      {
        error: 'Failed to update rate limit configuration',
        code: 'RATE_LIMIT_UPDATE_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rate-limits - Clear all rate limit data
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication - operations admin only
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    // Clear all metrics
    AdvancedRateLimiter.clearMetrics();

    return NextResponse.json({
      success: true,
      message: 'All rate limit data cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error clearing rate limit data:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear rate limit data',
        code: 'RATE_LIMIT_CLEAR_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
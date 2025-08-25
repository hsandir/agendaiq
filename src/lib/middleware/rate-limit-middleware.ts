import { NextRequest, NextResponse } from 'next/server';
import { RateLimiters, getClientIdentifier } from '@/lib/utils/rate-limit';

// Route-specific rate limiting configuration
const ROUTE_RATE_LIMITS: Record<string, { limiter: Record<string, unknown>; limit: number }> = {
  // Authentication routes
  '/api/auth/register': { limiter: RateLimiters.registration, limit: 3 },
  '/api/auth/forgot-password': { limiter: RateLimiters.passwordReset, limit: 5 },
  '/api/auth/create-admin': { limiter: RateLimiters.api, limit: 10 },
  
  // Sensitive operations
  '/api/staff/upload': { limiter: RateLimiters.api, limit: 20 },
  '/api/users': { limiter: RateLimiters.api, limit: 100 },
  '/api/admin': { limiter: RateLimiters.api, limit: 50 },
  
  // Meeting operations
  '/api/meetings': { limiter: RateLimiters.api, limit: 60 },
  '/api/meeting-templates': { limiter: RateLimiters.api, limit: 30 },
};

/**
 * Middleware to apply rate limiting to API routes
 */
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // Check if route needs rate limiting
  for (const [route, config] of Object.entries(ROUTE_RATE_LIMITS)) {
    if (pathname.startsWith(route)) {
      const clientId = getClientIdentifier(request);
      const result = await config.limiter.check(request, config.limit, clientId);
      
      if (!result.success) {
        console.log(`⚡ Rate limit exceeded for ${pathname} by ${clientId}`);
        return config.limiter.createErrorResponse(result);
      }
      
      // Rate limit check passed - return null to continue middleware chain
      // Headers will be added at the end of middleware chain
      return null;
    }
  }
  
  return null; // No rate limiting applied
}

/**
 * Helper function to check if a route should be rate limited
 */
export function shouldRateLimit(pathname: string): boolean {
  return Object.keys(ROUTE_RATE_LIMITS).some(route => pathname.startsWith(route))
}

/**
 * Enhanced client identifier that considers user session
 */
export function getEnhancedClientIdentifier(request: NextRequest, userId?: string): string {
  const baseId = getClientIdentifier(request);
  
  // If user is authenticated, include user ID for more accurate limiting
  if (userId) {
    return `user:${userId}:${baseId}`;
  }
  
  return `anon:${baseId}`;
}
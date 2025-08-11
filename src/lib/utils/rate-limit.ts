import { LRUCache } from 'lru-cache';
import { NextResponse } from 'next/server';

export interface RateLimitOptions {
  interval?: number; // Time window in milliseconds
  uniqueTokenPerInterval?: number; // Max unique tokens to track
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  error?: string;
}

export function rateLimit({
  interval = 60 * 1000, // default: 1 minute
  uniqueTokenPerInterval = 500, // default: max 500 users per interval
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
}: RateLimitOptions = {}) {
  const tokenCache = new LRUCache<string, { count: number; resetTime: number }>({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  return {
    check: async (
      request: Request, 
      limit: number, 
      token: string
    ): Promise<RateLimitResult> => {
      try {
        const now = Date.now();
        const tokenData = tokenCache.get(token) || { count: 0, resetTime: now + interval };

        // Reset counter if interval has passed
        if (now > tokenData.resetTime) {
          tokenData.count = 0;
          tokenData.resetTime = now + interval;
        }

        const isRateLimited = tokenData.count >= limit;
        const remaining = Math.max(0, limit - tokenData.count - 1);

        if (isRateLimited) {
          return {
            success: false,
            limit,
            remaining: 0,
            reset: tokenData.resetTime,
            error: `Rate limit exceeded. Try again in ${Math.ceil((tokenData.resetTime - now) / 1000)} seconds.`
          };
        }

        // Increment counter
        tokenData.count += 1;
        tokenCache.set(token, tokenData);

        return {
          success: true,
          limit,
          remaining,
          reset: tokenData.resetTime
        };
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Fail open - allow request if rate limiting fails
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: Date.now() + interval,
          error: 'Rate limiting service unavailable'
        };
      }
    },

    createErrorResponse: (result: RateLimitResult): NextResponse => {
      return NextResponse.json(
        {
          error: result.error || 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          timestamp: new Date().toISOString()
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
  };
}

// Predefined rate limiters for common use cases
export const RateLimiters = {
  // Strict rate limiting for authentication
  auth: rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 1000,
  }),

  // Moderate rate limiting for registration
  registration: rateLimit({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 1000,
  }),

  // Lenient rate limiting for general API usage
  api: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000,
  }),

  // Strict rate limiting for password reset
  passwordReset: rateLimit({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 1000,
  }),

  // Moderate rate limiting for meeting operations
  meetings: rateLimit({
    interval: 5 * 60 * 1000, // 5 minutes
    uniqueTokenPerInterval: 1000,
  }),

  // Lenient rate limiting for user preferences (theme/layout)
  userPreferences: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000,
  }),
  
  // Very lenient rate limiting for development/testing
  development: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000,
  }),
};

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers (reverse proxy support)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // You might want to combine with user agent for better identification
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${clientIp}:${userAgent.slice(0, 50)}`;
} 
import { LRUCache } from 'lru-cache';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import type { users } from '@prisma/client';

// Advanced rate limiting configuration
export interface AdvancedRateLimitOptions {
  interval?: number;
  uniqueTokenPerInterval?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  useRedis?: boolean;
  adaptiveThreshold?: boolean;
  burstAllowance?: number;
  customKeyPrefix?: string;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  userRoleMultipliers?: Record<string, number>;
}

export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  uniqueClients: number;
  averageResponseTime: number;
  peakRequestsPerMinute: number
}

export interface EnhancedRateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  error?: string;
  metrics?: RateLimitMetrics;
  adaptiveLimit?: number;
  burstRemaining?: number;
}

// Redis client for distributed rate limiting
let redisClient: Redis | null = null;
let redisRateLimiter: Ratelimit | null = null;

// Initialize Redis if environment variables are present
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  redisRateLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
  });
}

// Metrics storage
const metricsCache = new LRUCache<string, RateLimitMetrics>({
  max: 1000,
  ttl: 60 * 60 * 1000, // 1 hour
});

// Burst token bucket implementation
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// Burst token storage
const burstBuckets = new LRUCache<string, TokenBucket>({
  max: 1000,
  ttl: 60 * 60 * 1000, // 1 hour
});

// Advanced rate limiter class
export class AdvancedRateLimiter {
  private options: AdvancedRateLimitOptions;
  private tokenCache: LRUCache<string, { count: number; resetTime: number }>;
  private blacklistedIPs: Set<string>;
  private whitelistedIPs: Set<string>;

  constructor(options: AdvancedRateLimitOptions = {}) {
    this.options = {
      interval: 60 * 1000, // 1 minute
      uniqueTokenPerInterval: 500,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      useRedis: false,
      adaptiveThreshold: false,
      burstAllowance: 10,
      customKeyPrefix: 'rl',
      ipWhitelist: [],
      ipBlacklist: [],
      userRoleMultipliers: {
        Administrator: 10,
        Superintendent: 5,
        Principal: 3,
        'Vice Principal': 2,
        'Department Head': 1.5,
        Teacher: 1.2,
        Staff: 1,
      },
      ...options,
    };

    this.tokenCache = new LRUCache({
      max: this.options.uniqueTokenPerInterval!,
      ttl: this.options.interval!,
    });

    this.blacklistedIPs = new Set(this.options.ipBlacklist ?? []);
    this.whitelistedIPs = new Set(this.options.ipWhitelist ?? []);
  }

  async check(
    request: Request,
    limit: number,
    token: string,
    user?: users & { staff?: { role: { title: string } } }
  ): Promise<EnhancedRateLimitResult> {
    try {
      // Extract IP for whitelist/blacklist checking
      const clientIP = this.extractClientIP(request);
      
      // Check blacklist
      if (this.blacklistedIPs.has(clientIP)) {
        return this.createBlockedResult(limit, 'IP address is blacklisted');
      }

      // Check whitelist - bypass rate limiting
      if (this.whitelistedIPs.has(clientIP)) {
        return this.createAllowedResult(limit, limit);
      }

      // Apply role-based multiplier if user is provided
      let effectiveLimit = limit;
      if (user?.staff?.role?.key && this.options.userRoleMultipliers) {
        const multiplier = this.options.userRoleMultipliers[user.staff.role.key] || 1;
        effectiveLimit = Math.floor(limit * multiplier);
      }

      // Use Redis for distributed rate limiting if available
      if (this.options.useRedis && redisRateLimiter) {
        return await this.checkRedis(token, effectiveLimit);
      }

      // Use local in-memory rate limiting
      return await this.checkLocal(token, effectiveLimit, request);
    } catch (error: unknown) {
      console.error('Advanced rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return this.createAllowedResult(limit, limit - 1);
    }
  }

  private async checkRedis(token: string, limit: number): Promise<EnhancedRateLimitResult> {
    if (!redisRateLimiter) {
      return this.createAllowedResult(limit, limit);
    }

    const { _success, limit: _redisLimit, _remaining, _reset } = await redisRateLimiter.limit(
      `${this.options.customKeyPrefix || 'default'}:${_token}`
    );

    if (!success) {
      return this.createBlockedResult(limit, 'Rate limit exceeded');
    }

    return {
      success: true,
      limit: redisLimit,
      remaining,
      reset,
    };
  }

  private async checkLocal(
    token: string,
    limit: number,
    request: Request
  ): Promise<EnhancedRateLimitResult> {
    const now = Date.now();
    const tokenData = this.tokenCache.get(token) || { 
      count: 0, 
      resetTime: now + this.options.interval! 
    };

    // Reset counter if interval has passed
    if (now > tokenData.resetTime) {
      tokenData.count = 0;
      tokenData.resetTime = now + this.options.interval!;
    }

    // Check burst allowance
    let burstRemaining = 0;
    if (this.options.burstAllowance && this.options.burstAllowance > 0) {
      const bucketKey = `burst:${token}`;
      let bucket = burstBuckets.get(bucketKey);
      
      if (!bucket) {
        bucket = new TokenBucket(
          this.options.burstAllowance,
          limit / (this.options.interval! / 1000);
        );
        burstBuckets.set(bucketKey, bucket);
      }

      burstRemaining = bucket.getRemaining();
      
      // Allow burst if within normal limits
      if (tokenData.count >= limit && bucket.consume()) {
        return {
          success: true,
          limit,
          remaining: 0,
          reset: tokenData.resetTime,
          burstRemaining: burstRemaining - 1,
        };
      }
    }

    // Apply adaptive threshold if enabled
    let adaptiveLimit = limit;
    if (this.options.adaptiveThreshold) {
      adaptiveLimit = this.calculateAdaptiveLimit(token, limit);
    }

    const isRateLimited = tokenData.count >= adaptiveLimit;
    const remaining = Math.max(0, adaptiveLimit - tokenData.count - 1);

    if (isRateLimited) {
      this.updateMetrics(token, false);
      return this.createBlockedResult(
        adaptiveLimit,
        `Rate limit exceeded. Try again in ${Math.ceil((tokenData.resetTime - now) / 1000)} seconds.`
      );
    }

    // Increment counter
    tokenData.count += 1;
    this.tokenCache.set(token, tokenData);
    this.updateMetrics(token, true);

    return {
      success: true,
      limit: adaptiveLimit,
      remaining,
      reset: tokenData.resetTime,
      adaptiveLimit: this.options.adaptiveThreshold ? adaptiveLimit : undefined,
      burstRemaining,
      metrics: this.getMetrics(token),
    };
  }

  private calculateAdaptiveLimit(token: string, baseLimit: number): number {
    const metrics = this.getMetrics(token);
    
    if (!metrics) {
      return baseLimit;
    }

    // Increase limit for well-behaved clients
    const successRate = metrics.allowedRequests / Math.max(1, metrics.totalRequests);
    
    if (successRate > 0.95 && metrics.totalRequests > 100) {
      return Math.floor(baseLimit * 1.5);
    } else if (successRate > 0.8 && metrics.totalRequests > 50) {
      return Math.floor(baseLimit * 1.2);
    } else if (successRate < 0.5 && metrics.totalRequests > 20) {
      return Math.floor(baseLimit * 0.8);
    }

    return baseLimit;
  }

  private updateMetrics(token: string, allowed: boolean): void {
    const existing = metricsCache.get(token) || {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      uniqueClients: 1,
      averageResponseTime: 0,
      peakRequestsPerMinute: 0,
    };

    existing.totalRequests += 1;
    
    if (allowed) {
      existing.allowedRequests += 1;
    } else {
      existing.blockedRequests += 1;
    }

    // Update peak requests per minute
    const requestsPerMinute = existing.totalRequests / Math.max(1, this.options.interval! / 60000);
    existing.peakRequestsPerMinute = Math.max(existing.peakRequestsPerMinute, requestsPerMinute);

    metricsCache.set(token, existing);
  }

  private getMetrics(token: string): RateLimitMetrics | undefined {
    return metricsCache.get(token)
  }

  private extractClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    return (forwarded?.split(',')[0] || realIp) ?? 'unknown';
  }

  private createBlockedResult(limit: number, error: string): EnhancedRateLimitResult {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Date.now() + this.options.interval!,
      error,
    };
  }

  private createAllowedResult(limit: number, remaining: number): EnhancedRateLimitResult {
    return {
      success: true,
      limit,
      remaining,
      reset: Date.now() + this.options.interval!,
    };
  }

  createErrorResponse(result: EnhancedRateLimitResult): NextResponse {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
      'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
    };

    if (result.adaptiveLimit !== undefined) {
      headers['X-RateLimit-Adaptive-Limit'] = result.adaptiveLimit.toString();
    }

    if (result.burstRemaining !== undefined) {
      headers['X-RateLimit-Burst-Remaining'] = result.burstRemaining.toString();
    }

    return NextResponse.json(
      {
        error: result.error || 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        timestamp: new Date().toISOString(),
        metrics: result.metrics,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Get global metrics for monitoring
  static getGlobalMetrics(): Record<string, RateLimitMetrics> {
    const allMetrics: Record<string, RateLimitMetrics> = {};
    
    metricsCache.forEach((value, key) => {
      allMetrics[key] = value;
    });

    return allMetrics;
  }

  // Clear metrics cache
  static clearMetrics(): void {
    metricsCache.clear();
  }

  // Add IP to blacklist
  addToBlacklist(ip: string): void {
    this.blacklistedIPs.add(ip)
  }

  // Remove IP from blacklist
  removeFromBlacklist(ip: string): void {
    this.blacklistedIPs.delete(ip)
  }

  // Add IP to whitelist
  addToWhitelist(ip: string): void {
    this.whitelistedIPs.add(ip)
  }

  // Remove IP from whitelist
  removeFromWhitelist(ip: string): void {
    this.whitelistedIPs.delete(ip)
  }
}

// Enhanced predefined rate limiters
export const EnhancedRateLimiters = {
  // Strict rate limiting for authentication with adaptive thresholds
  auth: new AdvancedRateLimiter({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 1000,
    adaptiveThreshold: true,
    burstAllowance: 3,
    useRedis: !!redisClient,
  }),

  // Moderate rate limiting for registration
  registration: new AdvancedRateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 1000,
    adaptiveThreshold: false,
    burstAllowance: 2,
    useRedis: !!redisClient,
  }),

  // Lenient rate limiting for general API usage
  api: new AdvancedRateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 2000,
    adaptiveThreshold: true,
    burstAllowance: 20,
    useRedis: !!redisClient,
  }),

  // Strict rate limiting for password reset
  passwordReset: new AdvancedRateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 500,
    adaptiveThreshold: false,
    burstAllowance: 1,
    useRedis: !!redisClient,
  }),

  // Moderate rate limiting for meeting operations
  meetings: new AdvancedRateLimiter({
    interval: 5 * 60 * 1000, // 5 minutes
    uniqueTokenPerInterval: 1000,
    adaptiveThreshold: true,
    burstAllowance: 10,
    useRedis: !!redisClient,
  }),

  // Aggressive rate limiting for file uploads
  uploads: new AdvancedRateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 500,
    adaptiveThreshold: false,
    burstAllowance: 5,
    useRedis: !!redisClient,
  }),

  // Custom rate limiting for webhooks
  webhooks: new AdvancedRateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100,
    adaptiveThreshold: false,
    burstAllowance: 50,
    useRedis: !!redisClient,
  }),
};

// Helper function to get client identifier with user context
export function getEnhancedClientIdentifier(
  request: Request,
  userId?: string
): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = (forwarded?.split(',')[0] || realIp) ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  
  // Include user ID if available for more accurate rate limiting
  const identifier = userId 
    ? `user:${userId}` 
    : `ip:${clientIp}:${userAgent.slice(0, 50)}`;
  
  return identifier;
}

// Export monitoring endpoint handler
export async function handleRateLimitMonitoring(): Promise<NextResponse> {
  const metrics = AdvancedRateLimiter.getGlobalMetrics();
  
  const summary = {
    totalClients: Object.keys(metrics).length,
    totalRequests: Object.values(metrics).reduce((sum, m) => sum + m.totalRequests, 0),
    totalBlocked: Object.values(metrics).reduce((sum, m) => sum + m.blockedRequests, 0),
    totalAllowed: Object.values(metrics).reduce((sum, m) => sum + m.allowedRequests, 0),
    averageBlockRate: 
      Object.values(metrics).reduce((sum, m) => sum + m.blockedRequests, 0) /
      Math.max(1, Object.values(metrics).reduce((sum, m) => sum + m.totalRequests, 0)),
    topOffenders: Object.entries(metrics);
      .sort((a, b) => b[1].blockedRequests - a[1].blockedRequests)
      .slice(0, 10);
      .map(([key, value]) => ({
        identifier: key,
        blockedRequests: value.blockedRequests,
        totalRequests: value.totalRequests,
      })),
  };

  return NextResponse.json({
    summary,
    details: metrics,
    timestamp: new Date().toISOString(),
  });
}
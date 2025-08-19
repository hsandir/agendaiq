import { unstable_cache } from 'next/cache';

// Cache tags for different data types
export const CACHE_TAGS = {
  meetings: 'meetings',
  users: 'users',
  staff: 'staff',
  departments: 'departments',
  roles: 'roles',
  analytics: 'analytics'
} as const;

// Cache durations in seconds
export const CACHE_DURATIONS = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  day: 86400 // 24 hours
} as const;

// Create a cached function wrapper
export function createCachedFunction<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  tags: string[],
  options?: {
    revalidate?: number;
    tags?: string[];
  }
): T {
  return unstable_cache(
    fn,
    tags,
    {
      revalidate: options?.revalidate ?? CACHE_DURATIONS.medium,
      tags: options?.tags ?? tags
    }
  ) as T;
}

// In-memory cache for frequently accessed data
class MemoryCache {
  private cache = new Map<string, { data: unknown; expiry: number }>();

  set(key: string, data: unknown, ttlSeconds: number = 60) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiry });
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();

// Clean up expired cache entries every minute
if (typeof window === 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 60000);
}

// Cache key generators
export const cacheKeys = {
  meeting: (id: number) => `meeting:${id}`,
  userMeetings: (userId: number, page: number = 1) => `user:${userId}:meetings:${page}`,
  staffMeetings: (staffId: number, page: number = 1) => `staff:${staffId}:meetings:${page}`,
  departmentMeetings: (deptId: number, page: number = 1) => `dept:${deptId}:meetings:${page}`,
  meetingHistory: (meetingId: number) => `meeting:${meetingId}:history`,
  userRole: (userId: number) => `user:${userId}:role`,
  staffHierarchy: (staffId: number) => `staff:${staffId}:hierarchy`
};

// Response cache headers
export function setCacheHeaders(response: Response, maxAge: number = 60) {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
  response.headers.set('CDN-Cache-Control', `public, max-age=${maxAge * 2}`);
}
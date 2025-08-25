/**
 * Ultra-fast authentication for theme/layout endpoints
 * Uses cookies directly without NextAuth overhead
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export interface UltraFastUser {
  id: number;
  email: string;
  staff?: {
    id: number
  } | null;
}

/**
 * Get user ID from JWT token directly
 * Bypasses NextAuth for maximum performance
 */
// Cache the decoded user with timestamp
interface CachedUser {
  user: UltraFastUser | null;
  timestamp: number
}

let cachedUser: CachedUser | undefined = undefined;
const CACHE_DURATION = 1000; // 1 second cache

export async function getUltraFastUser(): Promise<UltraFastUser | null> {
  // Return cached user if still valid
  if (cachedUser && (Date.now() - cachedUser.timestamp < CACHE_DURATION)) {
    return cachedUser?.user;
  }
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('next-auth.session-token') || 
                  cookieStore.get('__Secure-next-auth.session-token');
    
    if (!token?.value) {
      cachedUser = { user: null, timestamp: Date.now() };
      return null;
    }

    // Decode JWT without verification for speed (only for non-critical operations)
    const decoded = jwt.decode(token?.value) as Record<string, unknown>;

    // NextAuth often uses `sub` as user id; support both id and sub
    const decodedId = (decoded?.id as unknown) ?? (decoded?.sub as unknown);
    const decodedEmail = (decoded?.email as unknown);

    if (!decodedId || !decodedEmail) {
      cachedUser = { user: null, timestamp: Date.now() };
      return null;
    }

    const user: UltraFastUser = {
      id: parseInt(String(decodedId)),
      email: String(decodedEmail),
      staff: (decoded as Record<string, unknown>).staff as { id: number } | null ?? null
    };
    
    cachedUser = { user, timestamp: Date.now() };
    return user;
  } catch (error: unknown) {
    console.error('Ultra fast auth error:', error);
    cachedUser = { user: null, timestamp: Date.now() };
    return null;
  }
}

/**
 * Cache user preferences in memory for even faster access
 */
class PreferenceCache {
  private cache = new Map<number, { theme?: string; layout?: string; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(userId: number): { theme?: string; layout?: string } | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this?.TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return { theme: entry?.theme, layout: entry?.layout };
  }

  set(userId: number, preferences: { theme?: string; layout?: string }) {
    const existing = this.cache.get(userId);
    this.cache.set(userId, {
      ...existing,
      ...preferences,
      timestamp: Date.now()
    });
  }

  clear(userId: number) {
    this.cache.delete(userId)
  }
}

export const preferenceCache = new PreferenceCache();

/**
 * Cache for user staff data to avoid repeated DB queries
 */
class UserStaffCache {
  private cache = new Map<number, { data: Record<string, unknown>; timestamp: number }>();
  private readonly TTL = 2 * 60 * 1000; // 2 minutes

  get(userId: number): Record<string, unknown> | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this?.TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return entry?.data;
  }

  set(userId: number, data: Record<string, unknown>) {
    this.cache.set(userId, {
      data,
      timestamp: Date.now()
    });
  }

  clear(userId: number) {
    this.cache.delete(userId)
  }

  clearAll() {
    this.cache.clear();
  }
}

export const userStaffCache = new UserStaffCache();
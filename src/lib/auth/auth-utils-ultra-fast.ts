/**
 * Ultra-fast authentication for theme/layout endpoints
 * Uses cookies directly without NextAuth overhead
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export interface UltraFastUser {
  id: number;
  email: string;
}

/**
 * Get user ID from JWT token directly
 * Bypasses NextAuth for maximum performance
 */
export async function getUltraFastUser(): Promise<UltraFastUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('next-auth.session-token') || 
                  cookieStore.get('__Secure-next-auth.session-token');
    
    if (!token?.value) {
      return null;
    }

    // Decode JWT without verification for speed (only for non-critical operations)
    const decoded = jwt.decode(token.value) as any;
    
    if (!decoded?.id || !decoded?.email) {
      return null;
    }

    return {
      id: parseInt(decoded.id),
      email: decoded.email
    };
  } catch (error) {
    console.error('Ultra fast auth error:', error);
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
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return { theme: entry.theme, layout: entry.layout };
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
    this.cache.delete(userId);
  }
}

export const preferenceCache = new PreferenceCache();

/**
 * Cache for user staff data to avoid repeated DB queries
 */
class UserStaffCache {
  private cache = new Map<number, { data: any; timestamp: number }>();
  private readonly TTL = 2 * 60 * 1000; // 2 minutes

  get(userId: number): any | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return entry.data;
  }

  set(userId: number, data: any) {
    this.cache.set(userId, {
      data,
      timestamp: Date.now()
    });
  }

  clear(userId: number) {
    this.cache.delete(userId);
  }

  clearAll() {
    this.cache.clear();
  }
}

export const userStaffCache = new UserStaffCache();
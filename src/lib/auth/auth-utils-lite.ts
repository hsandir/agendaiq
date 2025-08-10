/**
 * Lightweight authentication utilities for performance-critical endpoints
 * These functions load minimal user data for better performance
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

export interface LightweightUser {
  id: number;
  email: string;
  name?: string | null;
  theme_preference?: string | null;
  layout_preference?: string | null;
  custom_theme?: any;
}

/**
 * Get minimal user data for theme/layout endpoints
 * Much faster than getCurrentUser as it doesn't load relationships
 */
export async function getLightweightUser(): Promise<LightweightUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    // Get only essential user data - no joins
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        theme_preference: true,
        layout_preference: true,
        custom_theme: true,
      }
    });

    return user;
  } catch (error) {
    console.error('Lightweight auth error:', error);
    return null;
  }
}

/**
 * Fast auth check for theme/layout APIs
 */
export async function withLightAuth() {
  const user = await getLightweightUser();
  
  if (!user) {
    return {
      success: false,
      error: 'Authentication required',
      statusCode: 401
    };
  }

  return {
    success: true,
    user
  };
}
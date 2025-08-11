/**
 * Fast authentication utilities for theme/layout endpoints
 * Uses session data instead of database queries
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';

export interface FastUser {
  id: number;
  email: string;
  name?: string | null;
  staff?: {
    id: number;
  };
}

/**
 * Get user from session without database query
 * Much faster for simple preference endpoints
 */
export async function getFastUser(): Promise<FastUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    // Return user data directly from session
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      staff: session.user.staff ? { id: session.user.staff.id } : undefined
    };
  } catch (error) {
    console.error('Fast auth error:', error);
    return null;
  }
}
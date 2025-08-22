"use client";

import { useSession } from 'next-auth/react';
import { Capability, RoleKey, can, isRole } from '@/lib/auth/policy';

export interface UseAuthorizationResult {
  is: (role: RoleKey) => boolean;
  can: (capability: Capability | Capability[]) => boolean;
  loading: boolean;
  user: unknown;
}

export function useAuthorization(): UseAuthorizationResult {
  const { data: session, status } = useSession();

  const isFn = (role: RoleKey): boolean => {
    return isRole(session?.user as unknown as any, role);
  };

  const canFn = (capability: Capability | Capability[]): boolean => {
    return can(session?.user as unknown as any, capability);
  };

  return {
    is: isFn,
    can: canFn,
    loading: status === 'loading',
    user: session?.user,
  };
}

"use client";

import { useSession } from 'next-auth/react';
import { isRole, can, RoleKey, Capability } from '@/lib/auth/policy';
import type { AuthenticatedUser } from '@/lib/auth/auth-utils';

interface UseAuthorizationReturn {
  /**
   * Check if user has a specific role
   * @param roleKey - The RoleKey to check
   * @returns boolean indicating if user has the role
   */
  is: (roleKey: RoleKey) => boolean;
  
  /**
   * Check if user has specific capability/capabilities
   * @param capability - Single capability or array of capabilities
   * @returns boolean indicating if user has the capability
   */
  can: (capability: Capability | Capability[]) => boolean;
  
  /**
   * Current authenticated user
   */
  user: AuthenticatedUser | null;
  
  /**
   * Loading state
   */
  loading: boolean;
  
  /**
   * Authentication status
   */
  isAuthenticated: boolean;
}

/**
 * Unified authorization hook for client components
 * 
 * This hook provides consistent authorization patterns across all client components.
 * It replaces direct session access and ensures all auth checks use the canonical
 * RoleKey enum and capability system.
 * 
 * @example
 * ```typescript
 * const { is, can, loading } = useAuthorization();
 * 
 * if (loading) return <LoadingSpinner />;
 * 
 * return (
 *   <div>
 *     {is(RoleKey.OPS_ADMIN) && <AdminPanel />}
 *     {can(Capability.MEETING_CREATE) && <CreateMeetingButton />}
 *   </div>
 * );
 * ```
 */
export function useAuthorization(): UseAuthorizationReturn {
  const { data: session, status } = useSession();
  
  const user = session?.user as AuthenticatedUser | null;
  const loading = status === 'loading';
  const isAuthenticated = !!user;
  
  // Memoized functions to prevent unnecessary re-renders
  const isRoleCheck = (roleKey: RoleKey): boolean => {
    return isRole(user, roleKey);
  };
  
  const canCapabilityCheck = (capability: Capability | Capability[]): boolean => {
    return can(user, capability);
  };
  
  return {
    is: isRoleCheck,
    can: canCapabilityCheck,
    user,
    loading,
    isAuthenticated
  };
}

/**
 * Legacy hook compatibility
 * @deprecated Use useAuthorization() instead
 */
export const useAuth = useAuthorization;

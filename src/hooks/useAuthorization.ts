"use client";

import { useSession } from 'next-auth/react';
import { Capability, RoleKey, can, isRole } from '../lib/auth/policy';

export interface UseAuthorizationResult {
  is: (role: RoleKey) => boolean;
  can: (capability: Capability | Capability[]) => boolean;
  loading: boolean;
  user: unknown
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
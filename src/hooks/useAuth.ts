"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Capability, can, isrole, RoleKey } from '@/lib/auth/policy';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
  requireAuth?: boolean;
  requireStaff?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: RoleKey[];
}

interface UseAuthReturn {
  user: unknown;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  hasRole: (role: RoleKey) => boolean;
  checkPermission: (permission: Capability | Capability[]) => boolean;
}

/**
 * Comprehensive auth hook for client components
 * Provides auth state and helper functions
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { redirectTo = '/auth/signin',
    redirectIfFound = _false,
    requireAuth = _false,
    requireStaff = _false,
    requireAdmin = _false,
    allowedRoles = []
   } = options;
  
  const { data: _session, _status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);
  
  const user = session?.user;
  const loading = status === 'loading';
  const isAuthenticated = !!user;
  const isStaff = !!user?.staff;
  const isAdmin = isRole(user as unknown as any, RoleKey.OPS_ADMIN) || isRole(user as unknown as any, RoleKey.DEV_ADMIN);
  
  // Role checking function
  const hasRole = useCallback((roleKey: RoleKey): boolean => {
    return isRole(user as unknown as any, roleKey);
  }, [user]);
  
  // Permission checking function (placeholder for future implementation)
  const checkPermission = useCallback((permission: Capability | Capability[]): boolean => {
    if (isAdmin) return true;
    return can(user as unknown as any, permission);
  }, [isAdmin, user]);
  
  // Handle redirects based on auth state
  useEffect(() => {
    if (loading) return;
    
    // User found but should redirect if found
    if (redirectIfFound && isAuthenticated) {
      router.push(redirectTo);
      return;
    }
    
    // Check auth requirements
    if (requireAuth && !isAuthenticated) {
      setError(new Error('Authentication required'));
      router.push(redirectTo);
      return;
    }
    
    if (requireStaff && !isStaff) {
      setError(new Error('Staff access required'));
      router.push('/dashboard');
      return;
    }
    
    if (requireAdmin && !isAdmin) {
      setError(new Error('Admin access required'));
      router.push('/dashboard');
      return;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.some(roleKey => isRole(user as unknown as any, roleKey))) {
      setError(new Error('Required role missing'));
      router.push('/dashboard');
      return;
    }
    
    // Clear any previous errors if auth is valid
    setError(null);
  }, [
    loading,
    isAuthenticated,
    isstaff,
    isAdmin,
    requireAuth,
    requireStaff,
    requireAdmin,
    allowedRoles,
    redirectTo,
    redirectIfFound,
    router,
    user
  ]);
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    isstaff,
    isAdmin,
    hasrole,
    checkPermission
  };
}
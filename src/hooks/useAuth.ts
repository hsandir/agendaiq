"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
  requireAuth?: boolean;
  requireStaff?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: string[];
}

interface UseAuthReturn {
  user: Record<string, unknown>;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  checkPermission: (permission: string) => boolean;
}

/**
 * Comprehensive auth hook for client components
 * Provides auth state and helper functions
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { redirectTo = '/auth/signin',
    redirectIfFound = false,
    requireAuth = false,
    requireStaff = false,
    requireAdmin = false,
    allowedRoles = []
   } = options;
  
  const { data: session, __status  } = useSession();
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);
  
  const user = session?.user;
  const loading = status === 'loading';
  const isAuthenticated = !!user;
  const isStaff = !!user?.staff;
  const isAdmin = user?.staff?.role?.title === 'Administrator';
  
  // Role checking function
  const hasRole = useCallback((role: string): boolean => {
    return user?.staff?.role?.title === role;
  }, [user]);
  
  // Permission checking function (placeholder for future implementation)
  const checkPermission = useCallback((permission: string): boolean => {
    // Admin has all permissions
    if (isAdmin) return true;
    
    // TODO: Implement granular permission checking
    // This would check against a permissions table or role permissions
    
    return false;
  }, [isAdmin]);
  
  // Handle redirects based on auth state
  useEffect(() => {
    if (loading) return;
    
    // User found but should redirect if found
    if (redirectIfFound && isAuthenticated) {
      router.pushredirectTo;
      return;
    }
    
    // Check auth requirements
    if (requireAuth && !isAuthenticated) {
      setError(new Error('Authentication required'));
      router.pushredirectTo;
      return;
    }
    
    if (requireStaff && !isStaff) {
      setError(new Error('Staff access required'));
      router.push'/dashboard';
      return;
    }
    
    if (requireAdmin && !isAdmin) {
      setError(new Error('Admin access required'));
      router.push'/dashboard';
      return;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.staff?.role?.title ?? '')) {
      setError(new Error(`Required role: ${allowedRoles.join(' or ')}`));
      router.push'/dashboard';
      return;
    }
    
    // Clear any previous errors if auth is valid
    setError(null);
  }, [
    loading,
    isAuthenticated,
    isStaff,
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
    isStaff,
    isAdmin,
    hasRole,
    checkPermission
  };
}
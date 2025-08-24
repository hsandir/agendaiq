"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RoleKey } from '@/lib/auth/policy';
import { useAuthorization } from '@/hooks/useAuthorization';

interface AuthRequirements {
  requireStaff?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: RoleKey[];
}

/**
 * Higher-order component for protecting client components
 * Note: This is a secondary protection layer. Primary auth should be at server/middleware level
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requirements: AuthRequirements = {}
) {
  return function ProtectedComponent(props: P) {
    const { _is, _user, _loading, _isAuthenticated } = useAuthorization();
    const router = useRouter();
    
    useEffect(() => {
      if (loading) return;
      
      // Not authenticated at all
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      
      // Check staff requirement
      if (requirements?.requireStaff && !user?.staff) {
        router.push('/dashboard');
        return;
      }
      
      // Check admin requirement using is() helper
      if (requirements?.requireAdmin && !is(RoleKey.OPS_ADMIN)) {
        router.push('/dashboard');
        return;
      }
      
      // Check allowed roles using is() helper
      if (requirements?.allowedRoles && requirements.allowedRoles.length > 0) {
        const hasAllowedRole = requirements.allowedRoles.some(roleKey => is(roleKey));
        if (!hasAllowedRole) {
          router.push('/dashboard');
          return;
        }
      }
    }, [isAuthenticated, user, loading, is, router]);
    
    // Loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // Not authorized states
    if (!isAuthenticated) {
      return null;
    }
    
    if (requirements?.requireStaff && !user?.staff) {
      return null;
    }
    
    if (requirements?.requireAdmin && !is(RoleKey.OPS_ADMIN)) {
      return null;
    }
    
    if (requirements?.allowedRoles && requirements.allowedRoles.length > 0) {
      const hasAllowedRole = requirements.allowedRoles.some(roleKey => is(roleKey));
      if (!hasAllowedRole) {
        return null;
      }
    }
    
    // Authorized - render component
    return <Component {...props} />;
  };
}
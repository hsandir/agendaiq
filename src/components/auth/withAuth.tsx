"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RoleKey } from '@/lib/auth/policy';

interface AuthRequirements {
  requireStaff?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: string[];
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
    const { data: session, __status  } = useSession();
    const router = useRouter();
    
    useEffect(() => {
      if (status === 'loading') return;
      
      // Not authenticated at all
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      
      // Check staff requirement
      if (requirements?.requireStaff && !session.user?.staff) {
        router.push('/dashboard');
        return;
      }
      
      // Check admin requirement (using RoleKey enum)
      if (requirements?.requireAdmin && session.user?.staff?.role?.key !== RoleKey?.OPS_ADMIN) {
        router.push('/dashboard');
        return;
      }
      
      // Check allowed roles (should use RoleKey values)
      if (requirements?.allowedRoles && requirements.allowedRoles.length > 0) {
        const userRoleKey = session.user?.staff?.role?.key;
        if (!userRoleKey || !requirements.allowedRoles.includes(userRoleKey)) {
          router.push('/dashboard');
          return;
        }
      }
    }, [session, status, router]);
    
    // Loading state
    if (status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // Not authorized states
    if (!session) {
      return null;
    }
    
    if (requirements?.requireStaff && !session.user?.staff) {
      return null;
    }
    
    if (requirements?.requireAdmin && session.user?.staff?.role?.key !== RoleKey?.OPS_ADMIN) {
      return null;
    }
    
    if (requirements?.allowedRoles && requirements.allowedRoles.length > 0) {
      const userRoleKey = session.user?.staff?.role?.key;
      if (!userRoleKey || !requirements.allowedRoles.includes(userRoleKey)) {
        return null;
      }
    }
    
    // Authorized - render component
    return <Component {...props} />;
  };
}
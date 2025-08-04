"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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
    const { data: session, status } = useSession();
    const router = useRouter();
    
    useEffect(() => {
      if (status === 'loading') return;
      
      // Not authenticated at all
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      
      // Check staff requirement
      if (requirements.requireStaff && !session.user?.staff) {
        router.push('/dashboard');
        return;
      }
      
      // Check admin requirement
      if (requirements.requireAdmin && session.user?.staff?.role?.title !== 'Administrator') {
        router.push('/dashboard');
        return;
      }
      
      // Check allowed roles
      if (requirements.allowedRoles && requirements.allowedRoles.length > 0) {
        const userRole = session.user?.staff?.role?.title;
        if (!userRole || !requirements.allowedRoles.includes(userRole)) {
          router.push('/dashboard');
          return;
        }
      }
    }, [session, status, router]);
    
    // Loading state
    if (status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }
    
    // Not authorized states
    if (!session) {
      return null;
    }
    
    if (requirements.requireStaff && !session.user?.staff) {
      return null;
    }
    
    if (requirements.requireAdmin && session.user?.staff?.role?.title !== 'Administrator') {
      return null;
    }
    
    if (requirements.allowedRoles && requirements.allowedRoles.length > 0) {
      const userRole = session.user?.staff?.role?.title;
      if (!userRole || !requirements.allowedRoles.includes(userRole)) {
        return null;
      }
    }
    
    // Authorized - render component
    return <Component {...props} />;
  };
}
import { requireAuth, AuthRequirements, AuthenticatedUser } from '@/lib/auth/auth-utils';
import { redirect } from 'next/navigation';

interface ServerAuthWrapperProps {
  children: React.ReactNode | ((user: AuthenticatedUser) => React.ReactNode);
  requirements?: AuthRequirements;
  fallbackUrl?: string;
}

/**
 * Server component wrapper that enforces authentication
 * This ensures pages can't be accessed without proper auth
 */
export default async function ServerAuthWrapper({ 
  children, 
  requirements = { requireAuth: true },
  fallbackUrl = '/auth/signin'
}: ServerAuthWrapperProps) {
  try {
    const user = await requireAuth(requirements);
    
    // If children is a function, pass user to it
    if (typeof children === 'function') {
      return <>{children(user)}</>;
    }
    
    return <>{children}</>;
  } catch (error: unknown) {
    // Auth failed, redirect to fallback
    redirect(fallbackUrl);
  }
}
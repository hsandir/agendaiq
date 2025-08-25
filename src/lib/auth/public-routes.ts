/**
 * Public Routes Configuration
 * 
 * This file defines all routes and API endpoints that are explicitly public
 * and do not require authentication. This implements the default-secure posture
 * where all routes require authentication unless explicitly whitelisted here.
 * 
 * SECURITY NOTE: Only add routes here that genuinely need to be public.
 * All other routes will require authentication by default.
 */

// Public page routes that don't require authentication
export const PUBLIC_ROUTES = [
  // Authentication routes
  '/auth/signin',
  '/auth/signup', 
  '/auth/error',
  '/auth/forgot-password',
  '/verify-email',
  
  // Public landing/info pages
  '/',
  '/public-test',
  
  // Setup routes (only when system is not initialized)
  '/setup/district',
] as const;

// Public API endpoints that don't require authentication
export const PUBLIC_API_ROUTES = [
  // Authentication APIs
  '/api/auth',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/providers',
  '/api/auth/session',
  '/api/auth/csrf',
  
  // Health check and monitoring (public for external monitoring)
  '/api/health',
  '/api/system/status',
  
  // Setup APIs (only when system is not initialized)
  '/api/setup/check',
  '/api/setup/init',
  
  // Error reporting (public for client-side error reporting)
  '/api/error-capture',
  '/api/errors',
] as const;

// Helper types for TypeScript
export type PublicRoute = typeof PUBLIC_ROUTES[number];
export type PublicApiRoute = typeof PUBLIC_API_ROUTES[number];

/**
 * Check if a route path is explicitly public
 * @param path - The route path to check
 * @returns boolean indicating if the route is public
 */
export function isPublicRoute(path: string): boolean {
  // Exact match check
  if (PUBLIC_ROUTES.includes(path as PublicRoute)) {
    return true
  }
  
  // Pattern matching for auth routes
  if (path.startsWith('/auth/')) {
    return true;
  }
  
  return false;
}

/**
 * Check if an API route is explicitly public
 * @param path - The API route path to check
 * @returns boolean indicating if the API route is public
 */
export function isPublicApiRoute(path: string): boolean {
  // Exact match check
  if (PUBLIC_API_ROUTES.includes(path as PublicApiRoute)) {
    return true
  }
  
  // Pattern matching for auth APIs
  if (path.startsWith('/api/auth/')) {
    return true;
  }
  
  return false;
}

/**
 * Get all public routes and APIs for documentation/debugging
 * @returns Object containing all public routes and APIs
 */
export function getAllPublicEndpoints() {
  return {
    routes: [...PUBLIC_ROUTES],
    apis: [...PUBLIC_API_ROUTES],
    total: PUBLIC_ROUTES.length + PUBLIC_API_ROUTES.length
  };
}

/**
 * Validate that a route should be public (for development/testing)
 * @param path - The route path to validate
 * @returns Object with validation result and reason
 */
export function validatePublicRoute(path: string): { isValid: boolean; reason: string } {
  if (isPublicRoute(path)) {
    return { isValid: true, reason: 'Route is explicitly whitelisted as public' };
  }
  
  if (isPublicApiRoute(path)) {
    return { isValid: true, reason: 'API route is explicitly whitelisted as public' };
  }
  
  // Check for potentially problematic patterns
  if (path.includes('/admin') || path.includes('/system')) {
    return { 
      isValid: false, 
      reason: 'Admin/system routes should never be public' 
    };
  }
  
  if (path.includes('/dashboard')) {
    return { 
      isValid: false, 
      reason: 'Dashboard routes require authentication' 
    };
  }
  
  if (path.includes('/api/') && !path.startsWith('/api/auth/') && !path.includes('/health')) {
    return { 
      isValid: false, 
      reason: 'API routes should require authentication unless explicitly public' 
    };
  }
  
  return { 
    isValid: false, 
    reason: 'Route not in public whitelist - requires authentication by default' 
  };
}

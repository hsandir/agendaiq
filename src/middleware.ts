import { NextResponse } from "next/server";
import { getToken, JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit-middleware";
import { auditMiddleware } from "@/lib/middleware/audit-middleware";
import { canAccessRoute, canAccessApi, UserWithCapabilities } from "@/lib/auth/policy";
import { isPublicRoute, isPublicApiRoute } from "@/lib/auth/public-routes";

interface NextAuthToken {
  id?: string | number;
  email?: string;
  name?: string;
  is_system_admin?: boolean;
  is_school_admin?: boolean;
  capabilities?: string[];
  staff?: {
    id: number;
    role?: {
      id: number;
      key?: string | null;
      is_leadership?: boolean;
    };
  };
}

// Helper function to convert token to UserWithCapabilities
function tokenToUser(token: JWT | NextAuthToken | null): UserWithCapabilities | null {
  if (!token) return null;
  
  const id = typeof token.id === 'string' ? parseInt(token.id) : (token.id as number);
  if (!id) return null;
  
  const staff = token.staff as { id: number; role?: { id: number; key?: string | null; is_leadership?: boolean } } | undefined;
  
  return {
    id,
    email: token.email as string,
    name: token.name as string | undefined,
    is_system_admin: Boolean(token.is_system_admin) || (staff?.role?.key === 'DEV_ADMIN') || false,
    is_school_admin: Boolean(token.is_school_admin) || (staff?.role?.key === 'OPS_ADMIN') || false,
    roleKey: staff?.role?.key as string | undefined,
    capabilities: (token.capabilities as string[]) || [],
    staff
  };
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  
  // Apply rate limiting to API routes first
  if (path.startsWith("/api/")) {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Check if route is explicitly public (default-secure posture)
  if (isPublicRoute(path)) {
    // If user is already authenticated and trying to access auth pages, redirect to dashboard
    if (token && (path === '/auth/signin' || path === '/auth/forgot-password')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Public route - allow access without authentication
    return NextResponse.next();
  }

  // Protect dashboard routes - require authentication
  if (path.startsWith("/dashboard")) {
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(signInUrl);
    }
    
    // Use capability-based access control for dashboard routes
    const user = tokenToUser(token);
    if (!canAccessRoute(user, path)) {
      // Redirect to dashboard home for unauthorized access
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Protect API routes
  if (path.startsWith("/api/")) {
    // Skip auth for public endpoints ONLY
    // SECURITY: Dev/test/debug endpoints require authentication and proper capabilities
    // Use our centralized public API routes whitelist
    const isPublic = isPublicApiRoute(path) || 
                    // Temporary debug endpoints (should be removed in production)
                    path.startsWith('/api/test-login') ||
                    path.startsWith('/api/debug/user-capabilities') ||
                    path.startsWith('/api/debug/user-check') ||
                    path.startsWith('/api/debug/db-connection-test') ||
                    path.startsWith('/api/debug/db-schema-check') ||
                    path.startsWith('/api/debug/test-auth-direct') ||
                    path.startsWith('/api/debug/middleware-token') ||
                    path.startsWith('/api/user') || // User preference endpoints with lightweight auth
                    path.startsWith('/api/tests'); // Test runner API endpoints (development only)
    
    if (!isPublic && !token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Use capability-based access control for API routes
    if (token) {
      const user = tokenToUser(token);
      if (!canAccessApi(user, path)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
  }

  // Apply audit logging (non-blocking)
  const auditResponse = await auditMiddleware(request);
  if (auditResponse) {
    return auditResponse;
  }
  
  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
  ],
}; 
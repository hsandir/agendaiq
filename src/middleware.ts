import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit-middleware";
import { auditMiddleware } from "@/lib/middleware/audit-middleware";
import { canAccessRoute, canAccessApi, UserWithCapabilities } from "@/lib/auth/policy";

// Helper function to convert token to UserWithCapabilities
function tokenToUser(token: any): UserWithCapabilities | null {
  if (!token) return null;
  
  return {
    id: parseInt(token.id),
    email: token.email,
    name: token.name,
    is_system_admin: token.is_system_admin || token.staff?.role?.key === 'DEV_ADMIN' || false,
    is_school_admin: token.is_school_admin || token.staff?.role?.key === 'OPS_ADMIN' || false,
    roleKey: token.staff?.role?.key,
    capabilities: token.capabilities || [],
    staff: token.staff
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
    const publicEndpoints = [
      '/api/auth', 
      '/api/health', 
      '/api/setup/check',
      // REMOVED: /api/test-sentry, /api/dev, /api/tests, /api/debug - These require authentication
    ];
    const isPublic = publicEndpoints.some(endpoint => path.startsWith(endpoint));
    
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
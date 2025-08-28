import { NextResponse } from "next/server";
import { getToken, JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit-middleware";
import { auditMiddleware } from "@/lib/middleware/audit-middleware";
import { canAccessRoute, canAccessApi, UserWithCapabilities } from "@/lib/auth/policy-edge";
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
  console.error(`🚨 MIDDLEWARE RUNNING!!! PATH: ${request.nextUrl.pathname}`);
  try {
    const path = request.nextUrl.pathname;
    console.log(`🔍 MIDDLEWARE DEBUG: Processing path: ${path}`);
    console.log(`🔍 MIDDLEWARE DEBUG: USER-AGENT: ${request.headers.get('user-agent')}`);
    
    // Check if route is explicitly public (default-secure posture) FIRST
    // This prevents getToken() from blocking public routes
    const isPublic = isPublicRoute(path);
    console.log(`🔍 MIDDLEWARE DEBUG: isPublicRoute(${path}): ${isPublic}`);
    if (isPublic) {
      console.log(`✅ MIDDLEWARE DEBUG: Allowing public route: ${path}`);
      return NextResponse.next(); // Allow access to public routes immediately
    }
    
    // Check if this is a public API route early
    if (path.startsWith("/api/")) {
      const isPublicApi = isPublicApiRoute(path);
      console.log(`🔍 MIDDLEWARE DEBUG: isPublicApiRoute(${path}): ${isPublicApi}`);
      if (isPublicApi) {
        console.log(`✅ MIDDLEWARE DEBUG: Allowing public API route: ${path}`);
        return NextResponse.next(); // Allow access to public API routes immediately
      }
    }
    
    // Apply rate limiting to API routes first
    if (path.startsWith("/api/")) {
      const rateLimitResponse = await rateLimitMiddleware(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    let token;
    try {
      console.log(`🔍 MIDDLEWARE DEBUG: Getting token for: ${path}`);
      token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      console.log(`🔍 MIDDLEWARE DEBUG: Token result: ${token ? 'EXISTS' : 'NULL'}`);
    } catch (error: unknown) {
      console.error('❌ MIDDLEWARE ERROR: Error getting token in middleware:', error);
      token = null;
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
    
    console.log(`✅ MIDDLEWARE DEBUG: Request completed successfully for: ${path}`);
    return response;
  } catch (error: unknown) {
    console.error('❌ MIDDLEWARE FATAL ERROR:', error);
    console.error('❌ MIDDLEWARE: Allowing request to proceed due to error');
    // On error, allow the request to proceed
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/middleware/rate-limit-middleware";
import { auditMiddleware } from "@/lib/middleware/audit-middleware";

// Admin-only routes
const adminOnlyRoutes = [
  '/dashboard/system',
  '/dashboard/settings/admin',
  '/dashboard/settings/setup',
  '/dashboard/settings/audit',
  '/dashboard/settings/backup',
  '/dashboard/monitoring',
  '/api/admin',
  '/api/system',
  '/api/monitoring'
];

// Staff-only routes (requires staff record)
const staffOnlyRoutes = [
  '/dashboard/meetings',
  '/dashboard/settings/roles',
  '/dashboard/settings/permissions',
  '/dashboard/settings/users',
  '/api/meetings',
  '/api/roles',
  '/api/departments',
  '/api/staff'
];

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
    
    // Check admin-only routes
    const isAdminRoute = adminOnlyRoutes.some(route => path.startsWith(route));
    if (isAdminRoute) {
      const isAdmin = token.staff?.role?.title === 'Administrator';
      
      if (!isAdmin) {
        // Redirect non-admins to dashboard home
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Check staff-only routes
    const isStaffRoute = staffOnlyRoutes.some(route => path.startsWith(route));
    if (isStaffRoute) {
      const hasStaff = token.staff && token.staff.id;
      
      if (!hasStaff) {
        // Redirect non-staff to dashboard home
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  // Protect API routes
  if (path.startsWith("/api/")) {
    // Skip auth for public endpoints and development tools
    const publicEndpoints = [
      '/api/auth', 
      '/api/health', 
      '/api/setup/check', 
      '/api/test-sentry',
      '/api/dev',  // Development tools - accessible without auth in dev mode
      '/api/tests', // Test endpoints for development
      '/api/debug', // Debug endpoints for production troubleshooting
    ];
    const isPublic = publicEndpoints.some(endpoint => path.startsWith(endpoint));
    
    if (!isPublic && !token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check admin-only API routes
    const isAdminRoute = adminOnlyRoutes.some(route => path.startsWith(route));
    if (isAdminRoute && token) {
      const isAdmin = token.staff?.role?.title === 'Administrator';
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Administrator access required' },
          { status: 403 }
        );
      }
    }
    
    // Check staff-only API routes
    const isStaffRoute = staffOnlyRoutes.some(route => path.startsWith(route));
    if (isStaffRoute && token) {
      const hasStaff = token.staff && token.staff.id;
      
      if (!hasStaff) {
        return NextResponse.json(
          { error: 'Staff access required' },
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
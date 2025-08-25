import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// CSRF token generation and validation
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly TOKEN_COOKIE = 'csrf-token';
  
  /**
   * Generate a new CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }
  
  /**
   * Store CSRF token in response cookies
   */
  static setTokenCookie(response: NextResponse, token: string): void {
    response.cookies.set(this.TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
  }
  
  /**
   * Get CSRF token from request
   */
  static getTokenFromRequest(request: NextRequest): string | null {
    // Check header first (for AJAX requests)
    const headerToken = request.headers.get(this.TOKEN_HEADER);
    if (headerToken) return headerToken;
    
    // Check request body (for form submissions)
    // This would need to be parsed from the body in the actual handler
    
    return null;
  }
  
  /**
   * Validate CSRF token
   */
  static async validateToken(request: NextRequest): Promise<boolean> {
    // Skip validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }
    
    // Get token from cookie
    const cookieToken = request.cookies.get(this.TOKEN_COOKIE)?.value;
    if (!cookieToken) return false;
    
    // Get token from request
    const requestToken = this.getTokenFromRequest(request);
    if (!requestToken) return false;
    
    // Compare tokens
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(requestToken)
    );
  }
  
  /**
   * Middleware to enforce CSRF protection
   */
  static async middleware(request: NextRequest): Promise<NextResponse | null> {
    // Skip for API routes that don't modify state
    const skipPaths = [
      '/api/auth/session',
      '/api/health',
      '/api/setup/check'
    ];
    
    if (skipPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      return null;
    }
    
    // Validate token for state-changing requests
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const isValid = await this.validateToken(request);
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    }
    
    return null;
  }
  
  /**
   * Get or create CSRF token for a session
   */
  static async getOrCreateToken(request: NextRequest): Promise<string> {
    const existingToken = request.cookies.get(this.TOKEN_COOKIE)?.value;
    
    if (existingToken) {
      return existingToken;
    }
    
    return this.generateToken();
  }
}

// Hook for client-side CSRF token usage
export function useCSRFToken() {
  if (typeof window === 'undefined') {
    throw new Error('useCSRFToken can only be used on the client side');
  }
  
  const getToken = (): string | null => {
    // Get token from cookie
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => 
      String(cookie).trim().startsWith(`${CSRFProtection['TOKEN_COOKIE']}=`);
    );
    
    if (csrfCookie) {
      return csrfCookie.split('=')[1];
    }
    
    return null;
  };
  
  const addTokenToHeaders = (headers: HeadersInit = {}): HeadersInit => {
    const token = getToken();
    
    if (token) {
      return {
        ...headers,
        [CSRFProtection['TOKEN_HEADER']]: token
      };
    }
    
    return headers;
  };
  
  return {
    token: getToken(),
    addTokenToHeaders
  };
}
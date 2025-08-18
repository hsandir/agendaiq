// Client-side audit event handler that works in both edge and node environments
import { NextRequest } from 'next/server';

export class AuditClient {
  private static async sendToAuditAPI(event: Record<string, any>): Promise<void> {
    try {
      // Only send to API in server environments
      if (typeof window === 'undefined') {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/internal/audit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event)
        });

        if (!response.ok) {
          console.warn('Failed to send audit event to API');
        }
      }
    } catch (error: unknown) {
      console.warn('Audit API error:', error);
    }
  }

  static async logAuthEvent(
    action: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change',
    userId?: number,
    staffId?: number,
    request?: NextRequest,
    errorMessage?: string
  ): Promise<void> {
    const event = {
      action: `auth_${action}`,
      path: request?.nextUrl?.pathname || '/auth',
      method: request?.method || 'POST',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent'),
      success: !action.includes('failure') && !errorMessage,
      errorMessage,
      category: 'AUTH',
      metadata: { userId, staffId },
      timestamp: new Date().toISOString()
    };

    await this.sendToAuditAPI(event);
  }

  static async logSecurityEvent(
    action: string,
    userId?: number,
    staffId?: number,
    request?: NextRequest,
    errorMessage?: string
  ): Promise<void> {
    const event = {
      action: `security_${action}`,
      path: request?.nextUrl?.pathname || '/unknown',
      method: request?.method || 'POST',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent'),
      success: !errorMessage,
      errorMessage,
      category: 'SECURITY',
      metadata: { userId, staffId },
      timestamp: new Date().toISOString()
    };

    await this.sendToAuditAPI(event);
  }

  private static getClientIP(request?: NextRequest): string {
    if (!request) return 'unknown';

    // Try various headers for real IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }
    
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    return 'unknown';
  }
}
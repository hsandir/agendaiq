// Edge Runtime compatible audit logger for Next.js middleware
// This version doesn't use Node.js modules like 'fs' or 'path'

import { NextRequest } from 'next/server';

export interface EdgeAuditEvent {
  timestamp: string;
  path: string;
  method: string;
  userAgent?: string;
  ipAddress?: string;
  duration?: number;
  status?: number;
  userId?: number;
  staffId?: number;
}

export class EdgeAuditLogger {
  // Simple in-memory buffer for edge runtime
  private static eventBuffer: EdgeAuditEvent[] = [];
  private static readonly MAX_BUFFER_SIZE = 100;

  static logRequest(request: NextRequest, duration?: number, status?: number): EdgeAuditEvent {
    const event: EdgeAuditEvent = {
      timestamp: new Date().toISOString(),
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: this.getClientIP(request),
      duration,
      status
    };

    // Add to buffer (keep only recent events)
    this.eventBuffer.push(event);
    if (this.eventBuffer.length > this.MAX_BUFFER_SIZE) {
      this.eventBuffer.shift();
    }

    return event;
  }

  static getClientIP(request: NextRequest): string {
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

  static getRecentEvents(limit: number = 50): EdgeAuditEvent[] {
    return this.eventBuffer.slice(-limit);
  }

  static clearBuffer(): void {
    this.eventBuffer = [];
  }

  // Create a simple audit event that can be sent to API route for processing
  static createAuditEvent(
    action: string,
    request: NextRequest,
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Record<string, any> {
    return {
      action,
      path: request.nextUrl.pathname,
      method: request.method,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent'),
      success,
      errorMessage,
      metadata,
      timestamp: new Date().toISOString()
    };
  }
}
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

// Define safe types for audit metadata
export type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

export class EdgeAuditLogger {
  // Secure circular buffer for edge runtime with memory protection
  private static eventBuffer: EdgeAuditEvent[] = [];
  private static readonly MAX_BUFFER_SIZE = 50; // Reduced for memory efficiency
  private static readonly MAX_EVENT_AGE_MS = 5 * 60 * 1000; // 5 minutes
  private static bufferIndex = 0;
  private static lastCleanup = Date.now();
  private static readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

  static logRequest(request: NextRequest, duration?: number, status?: number): EdgeAuditEvent {
    const now = Date.now();
    const event: EdgeAuditEvent = {
      timestamp: new Date(now).toISOString(),
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: this.getClientIP(request),
      duration,
      status
    };

    // Perform periodic cleanup to prevent memory bloat
    this.performPeriodicCleanup(now);

    // Use circular buffer to prevent unbounded growth
    if (this.eventBuffer.length < this.MAX_BUFFER_SIZE) {
      this.eventBuffer.push(event);
    } else {
      // Overwrite oldest event in circular fashion
      this.eventBuffer[(this.bufferIndex)] = event;
      this.bufferIndex = (this.bufferIndex + 1) % this.MAX_BUFFER_SIZE;
    }

    return event;
  }

  private static performPeriodicCleanup(currentTime: number): void {
    // Only cleanup periodically to avoid performance impact
    if (currentTime - this.lastCleanup < this.CLEANUP_INTERVAL_MS) {
      return;
    }

    this.lastCleanup = currentTime;
    const cutoffTime = currentTime - this.MAX_EVENT_AGE_MS;

    // Remove events older than MAX_EVENT_AGE_MS
    this.eventBuffer = this.eventBuffer.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime > cutoffTime;
    });

    // Reset buffer index if buffer was reduced
    if (this.bufferIndex >= this.eventBuffer.length) {
      this.bufferIndex = 0;
    }
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
    
    // Return unknown instead of logging warning to avoid console spam
    return 'unknown';
  }

  static getRecentEvents(limit: number = 25): EdgeAuditEvent[] {
    // Ensure limit doesn't exceed buffer size for security
    const safeLimit = Math.min(Math.max(1, limit), this.MAX_BUFFER_SIZE);
    
    // Perform cleanup before returning events
    this.performPeriodicCleanup(Date.now());
    
    // Return most recent events (chronologically sorted)
    return this.eventBuffer
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, safeLimit);
  }

  static clearBuffer(): void {
    this.eventBuffer = [];
    this.bufferIndex = 0;
    this.lastCleanup = Date.now();
  }

  // Get buffer statistics for monitoring
  static getBufferStats(): { 
    currentSize: number; 
    maxSize: number; 
    oldestEventAge: number | null;
    memoryUsage: string;
  } {
    const now = Date.now();
    let oldestAge: number | null = null;
    
    if (this.eventBuffer.length > 0) {
      const oldestEvent = this.eventBuffer.reduce((oldest, current) => {
        const currentTime = new Date(current.timestamp).getTime();
        const oldestTime = new Date(oldest.timestamp).getTime();
        return currentTime < oldestTime ? current : oldest;
      });
      oldestAge = now - new Date(oldestEvent.timestamp).getTime();
    }

    // Estimate memory usage (rough calculation)
    const avgEventSize = 200; // bytes per event (estimated)
    const estimatedMemory = this.eventBuffer.length * avgEventSize;

    return {
      currentSize: this.eventBuffer.length,
      maxSize: this.MAX_BUFFER_SIZE,
      oldestEventAge: oldestAge,
      memoryUsage: `~${(estimatedMemory / 1024).toFixed(1)}KB`
    };
  }

  // Create a simple audit event that can be sent to API route for processing
  static createAuditEvent(
    action: string,
    request: NextRequest,
    success: boolean = true,
    errorMessage?: string,
    metadata?: AuditMetadata
  ): AuditMetadata {
    return {
      action,
      path: request.nextUrl.pathname,
      method: request.method,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent'),
      success,
      errorMessage,
      ...metadata,
      timestamp: new Date().toISOString()
    };
  }
}
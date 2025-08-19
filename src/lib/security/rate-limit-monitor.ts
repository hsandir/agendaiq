import { prisma } from "@/lib/prisma";

export interface RateLimitViolation {
  clientId: string;
  route: string;
  timestamp: Date;
  attempts: number;
  userAgent?: string;
  ip?: string;
}

/**
 * Monitor and log rate limit violations for security analysis
 */
export class RateLimitMonitor {
  private static violations: RateLimitViolation[] = [];
  private static readonly MAX_VIOLATIONS = 1000;

  /**
   * Log a rate limit violation
   */
  static logViolation(violation: RateLimitViolation): void {
    this.violations.push(violation);
    
    // Keep only the most recent violations
    if (this.violations.length > this.MAX_VIOLATIONS) {
      this.violations.shift();
    }

    // Log to console for immediate visibility
    console.warn(
      `🚨 Rate limit violation: ${violation.clientId} attempted ${violation.attempts} requests to ${violation.route}`
    );

    // For serious violations (high attempt counts), consider additional actions
    if (violation.attempts > 50) {
      console.error(
        `⚠️  SEVERE: Client ${violation.clientId} made ${violation.attempts} attempts to ${violation.route} - possible attack`
      );
      
      // Could trigger additional security measures here:
      // - Send alert to administrators
      // - Temporary IP blocking
      // - Escalated logging
    }
  }

  /**
   * Get recent violations for analysis
   */
  static getViolations(limit: number = 100): RateLimitViolation[] {
    return this.violations.slice(-limit);
  }

  /**
   * Get violations by client ID
   */
  static getViolationsByClient(clientId: string): RateLimitViolation[] {
    return this.violations.filter(v => v.clientId === clientId);
  }

  /**
   * Get violation statistics
   */
  static getStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentViolations = this.violations.filter(v => v.timestamp > oneHourAgo);
    const dailyViolations = this.violations.filter(v => v.timestamp > oneDayAgo);

    const topOffenders = this.getTopOffenders(10);
    const routeStats = this.getRouteStats();

    return {
      total: this.violations.length,
      lastHour: recentViolations.length,
      lastDay: dailyViolations.length,
      topOffenders,
      routeStats,
      isUnderAttack: recentViolations.length > 100 // Simple heuristic
    };
  }

  /**
   * Get top offending client IDs
   */
  private static getTopOffenders(limit: number): Array<{ clientId: string; violations: number; lastSeen: Date }> {
    const clientCounts = new Map<string, { count: number; lastSeen: Date }>();

    this.violations.forEach(v => {
      const existing = clientCounts.get(v.clientId);
      if (existing) {
        existing.count++;
        existing.lastSeen = v.timestamp > existing.lastSeen ? v.timestamp : existing.lastSeen;
      } else {
        clientCounts.set(v.clientId, { count: 1, lastSeen: v.timestamp });
      }
    });

    return Array.from(clientCounts.entries())
      .map(([clientId, data]) => ({
        clientId,
        violations: data.count,
        lastSeen: data.lastSeen
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, limit);
  }

  /**
   * Get statistics by route
   */
  private static getRouteStats(): Array<{ route: string; violations: number }> {
    const routeCounts = new Map<string, number>();

    this.violations.forEach(v => {
      routeCounts.set(v.route, (routeCounts.get(v.route) ?? 0) + 1);
    });

    return Array.from(routeCounts.entries())
      .map(([route, violations]) => ({ route, violations }))
      .sort((a, b) => b.violations - a.violations);
  }

  /**
   * Clear old violations (maintenance function)
   */
  static clearOldViolations(olderThan: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)): void {
    this.violations = this.violations.filter(v => v.timestamp > olderThan);
  }

  /**
   * Check if a client should be temporarily blocked
   */
  static shouldBlockClient(clientId: string): boolean {
    const recentViolations = this.getViolationsByClient(clientId)
      .filter(v => v.timestamp > new Date(Date.now() - 60 * 60 * 1000)); // Last hour

    // Block if more than 10 violations in the last hour
    return recentViolations.length > 10;
  }
}

/**
 * Enhanced rate limiting with violation tracking
 */
export function trackRateLimitViolation(
  clientId: string,
  route: string,
  attempts: number,
  request?: Request
): void {
  const violation: RateLimitViolation = {
    clientId,
    route,
    timestamp: new Date(),
    attempts,
    userAgent: request?.headers.get('user-agent') || undefined,
    ip: request?.headers.get('x-forwarded-for')?.split(',')[0] || 
        request?.headers.get('x-real-ip') || undefined
  };

  RateLimitMonitor.logViolation(violation);
}
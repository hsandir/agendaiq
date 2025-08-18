/**
 * Real-time Transport for Live Monitoring
 * Integrates with live monitoring system and WebSocket broadcasting
 */

import { LogTransport, LogLevel, BaseLogEntry, DevLogEntry, AuditLogEntry, LiveLogEvent } from '../types';
import { pusherServer } from '@/lib/pusher';

export class RealtimeTransport implements LogTransport {
  name = 'realtime';
  level: LogLevel;
  private channel: string;

  constructor(level: LogLevel = LogLevel.WARN, channel: string = 'monitoring-logs') {
    this.level = level;
    this.channel = channel;
  }

  private convertToLiveEvent(entry: BaseLogEntry): LiveLogEvent {
    const isDev = 'category' in entry && typeof entry.category === 'string' && 
                 ['system', 'database', 'api', 'auth', 'performance', 'error', 'network', 'cache', 'external', 'build'].includes(entry.category);

    const severity = this.determineSeverity(entry);
    const tags = this.generateTags(entry);

    return {
      ...entry,
      source: isDev ? 'dev' : 'audit',
      category: isDev ? (entry as DevLogEntry).category : (entry as AuditLogEntry).category,
      severity,
      tags,
      correlationId: this.generateCorrelationId(entry)
    };
  }

  private determineSeverity(entry: BaseLogEntry): 'low' | 'medium' | 'high' | 'critical' {
    // Determine severity based on log level and content
    if (entry.level >= LogLevel.FATAL) return 'critical';
    if (entry.level >= LogLevel.ERROR) return 'high';
    if (entry.level >= LogLevel.WARN) return 'medium';
    
    // Check for specific patterns that indicate higher severity
    const message = entry.message.toLowerCase();
    if (message.includes('security') || message.includes('breach') || message.includes('attack')) {
      return 'critical';
    }
    if (message.includes('failed') || message.includes('timeout') || message.includes('unauthorized')) {
      return 'high';
    }
    if (message.includes('deprecated') || message.includes('slow')) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateTags(entry: BaseLogEntry): string[] {
    const tags: string[] = [];
    
    // Add level tag
    tags.push(`level:${LogLevel[entry.level]}`);
    
    // Add category tag
    if ('category' in entry) {
      tags.push(`category:${entry.category}`);
    }
    
    // Add environment tag
    if ('environment' in entry) {
      tags.push(`env:${(entry as DevLogEntry).environment}`);
    }
    
    // Add component tag
    if ('component' in entry && (entry as DevLogEntry).component) {
      tags.push(`component:${(entry as DevLogEntry).component}`);
    }
    
    // Add risk level for audit logs
    if ('riskLevel' in entry) {
      tags.push(`risk:${(entry as AuditLogEntry).riskLevel}`);
    }
    
    // Add context-based tags
    if (entry.context) {
      if (entry.context.method) tags.push(`method:${entry.context.method}`);
      if (entry.context.statusCode) {
        tags.push(`status:${entry.context.statusCode}`);
        if (entry.context.statusCode >= 500) tags.push('server-error');
        else if (entry.context.statusCode >= 400) tags.push('client-error');
      }
    }
    
    return tags;
  }

  private generateCorrelationId(entry: BaseLogEntry): string {
    // Generate correlation ID based on user session and timestamp
    const userId = entry.context?.userId || 'anonymous';
    const sessionId = entry.context?.sessionId || 'no-session';
    const timestamp = Math.floor(new Date(entry.timestamp).getTime() / 1000 / 60); // Per minute
    
    return `${userId}-${sessionId}-${timestamp}`;
  }

  async write(entry: BaseLogEntry): Promise<void> {
    if (entry.level < this.level) {
      return;
    }

    try {
      const liveEvent = this.convertToLiveEvent(entry);
      
      // Broadcast to monitoring channel
      await pusherServer.trigger(this.channel, 'log-event', liveEvent);
      
      // Also broadcast to user-specific channels for high-severity events
      if (liveEvent.severity === 'critical' || liveEvent.severity === 'high') {
        if (entry.context?.userId) {
          await pusherServer.trigger(`user-${entry.context.userId}`, 'critical-log', liveEvent);
        }
        
        // Broadcast to admin channel
        await pusherServer.trigger('admin-alerts', 'critical-log', liveEvent);
      }
      
      // Store in memory for dashboard queries (keep last 1000 events)
      this.addToMemoryBuffer(liveEvent);
      
    } catch (error: unknown) {
      console.error('Failed to broadcast log event:', error);
    }
  }

  private memoryBuffer: LiveLogEvent[] = [];
  private readonly maxBufferSize = 1000;

  private addToMemoryBuffer(event: LiveLogEvent): void {
    this.memoryBuffer.unshift(event);
    if (this.memoryBuffer.length > this.maxBufferSize) {
      this.memoryBuffer = this.memoryBuffer.slice(0, this.maxBufferSize);
    }
  }

  async query(): Promise<LiveLogEvent[]> {
    // Return recent events from memory buffer
    return [...this.memoryBuffer];
  }

  async queryByTags(tags: string[], limit = 100): Promise<LiveLogEvent[]> {
    return this.memoryBuffer
      .filter(event => tags.some(tag => event.tags?.includes(tag)))
      .slice(0, limit);
  }

  async queryBySeverity(severity: 'low' | 'medium' | 'high' | 'critical', limit = 100): Promise<LiveLogEvent[]> {
    return this.memoryBuffer
      .filter(event => event.severity === severity)
      .slice(0, limit);
  }

  async getStats(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const stats = {
      total: this.memoryBuffer.length,
      bySeverity: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    this.memoryBuffer.forEach(event => {
      // Count by severity
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      
      // Count by source
      stats.bySource[event.source] = (stats.bySource[event.source] || 0) + 1;
      
      // Count by category
      stats.byCategory[String(event.category)] = (stats.byCategory[String(event.category)] || 0) + 1;
    });

    return stats;
  }
}
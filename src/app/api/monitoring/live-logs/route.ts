import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { LiveLogEvent } from '@/lib/logging/types';

// Generate sample logs for demonstration
function generateSampleLogs(): LiveLogEvent[] {
  const severities = ['info', 'warning', 'error', 'debug'] as const;
  const sources = ['client', 'server', 'database', 'auth', 'api'] as const;
  const categories = ['performance', 'security', 'system', 'user-action', 'audit'] as const;
  
  const messages = [
    'User login successful',
    'API request completed',
    'Database query executed',
    'Session created',
    'File uploaded successfully',
    'Cache cleared',
    'Background job completed',
    'Email sent successfully',
    'Payment processed',
    'Report generated',
    'Authentication token refreshed',
    'User preferences updated',
    'Meeting created successfully',
    'Agenda item added',
    'Permission check passed',
    'Role updated',
    'System health check completed',
    'Backup started',
    'Migration completed',
    'WebSocket connection established'
  ];

  const errorMessages = [
    'Failed to connect to database',
    'Authentication failed: Invalid credentials',
    'API rate limit exceeded',
    'File upload failed: Size limit exceeded',
    'Permission denied: Insufficient privileges',
    'Session expired',
    'Invalid request format',
    'Service temporarily unavailable',
    'Timeout while processing request',
    'Memory usage critical'
  ];

  const logs: LiveLogEvent[] = [];
  const now = Date.now();
  
  // Generate 10-20 random logs
  const logCount = Math.floor(Math.random() * 10) + 10;
  
  for (let i = 0; i < logCount; i++) {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const isError = severity === 'error' || (severity === 'warning' && Math.random() > 0.5);
    const messageList = isError ? errorMessages : messages;
    const message = messageList[Math.floor(Math.random() * messageList.length)];
    
    logs.push({
      id: `log-${now}-${i}`,
      timestamp: new Date(now - Math.floor(Math.random() * 60000)).toISOString(), // Within last minute
      severity: severity === 'error' ? 'critical' : severity === 'warning' ? 'high' : severity === 'info' ? 'medium' : 'low',
      source: source === 'client' || source === 'database' || source === 'api' || source === 'server' ? 'dev' : 'audit',
      category: 'GENERAL' as any,
      level: severity as any,
      message,
      metadata: {
        userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        duration: Math.floor(Math.random() * 1000),
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        path: `/api/${source}/${Math.random().toString(36).substr(2, 5)}`
      }
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Generate statistics
function generateStats(logs: LiveLogEvent[]) {
  const stats = {
    total: logs.length,
    bySeverity: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    byCategory: {} as Record<string, number>
  };
  
  logs.forEach(log => {
    // Count by severity
    stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
    
    // Count by source
    stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
    
    // Count by category
    stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
  });
  
  return stats;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_LOGS });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }
    // Generate sample logs
    const logs = generateSampleLogs();
    const stats = generateStats(logs);
    
    return NextResponse.json({
      success: true,
      logs,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating monitoring logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch monitoring logs',
        logs: [],
        stats: {
          total: 0,
          bySeverity: {},
          bySource: {},
          byCategory: {}
        }
      },
      { status: 500 }
    );
  }
}
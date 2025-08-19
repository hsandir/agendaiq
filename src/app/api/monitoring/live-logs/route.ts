import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { can, Capability } from '@/lib/auth/policy';
import { LogLevel } from '@/lib/logging/types';

// Get live logs from the realtime transport buffer
export async function GET(request: NextRequest) {
  // Require operations logs capability for live monitoring
  const authResult = await withAuth(request);
  if (!authResult?.success) {
    return NextResponse.json({ error: authResult?.error }, { status: authResult?.statusCode });
  }

  const user = authResult.user!;

  // Check operations logs capability
  if (!can(user, Capability?.OPS_LOGS)) {
    return NextResponse.json({ error: 'Operations logs access required' }, { status: 403 });
  }

  try {
    // Import the realtime transport to access memory buffer
    const { RealtimeTransport } = await import('@/lib/logging/transports/realtime-transport');
    
    // Create a temporary transport instance to access the buffer
    // In a real implementation, you'd want to maintain a singleton
    const realtimeTransport = new RealtimeTransport(LogLevel?.DEBUG);
    
    // Get recent events and stats
    const [logs, stats] = await Promise.all([
      realtimeTransport.query(),
      realtimeTransport.getStats()
    ]);

    return NextResponse.json({
      success: true,
      logs: logs.slice(0, 100), // Return last 100 events
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Failed to fetch live logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch live monitoring data',
      logs: [],
      stats: {
        total: 0,
        bySeverity: {},
        bySource: {},
        byCategory: {}
      }
    }, { status: 500 });
  }
}
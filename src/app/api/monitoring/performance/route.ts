import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

// POST /api/monitoring/performance - Log performance metrics
export async function POST(request: NextRequest) {
  // Performance monitoring doesn't require strict auth since it's for monitoring
  try {
    const metric = await request.json();
    
    // Only log in development with debug flag
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_PERFORMANCE === 'true') {
      console.log('📊 Performance Metric:', {
        name: metric.name,
        value: `${metric.value}ms`,
        timestamp: new Date(metric.timestamp).toLocaleTimeString(),
        url: metric.url
      });
    }
    
    // In production, you would send this to your monitoring service
    // Examples: Datadog, New Relic, custom analytics
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to log performance metric' },
      { status: 500 }
    );
  }
}

// GET /api/monitoring/performance - Get performance summary (for admin dashboard)
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  // This would typically come from your monitoring database
  // For now, return mock performance data for demonstration
  const performanceSummary = {
    avgPageLoadTime: 95.5,
    avgAPIResponseTime: 45.2,
    errorRate: 0.8,
    totalRequests: 1250,
    lastUpdated: new Date().toISOString(),
    breakdown: {
      'theme_api': { avg: 42, count: 156, success_rate: 99.4 },
      'layout_api': { avg: 38, count: 145, success_rate: 100 },
      'custom_theme_api': { avg: 51, count: 23, success_rate: 95.7 }
    }
  };

  return NextResponse.json(performanceSummary);
}
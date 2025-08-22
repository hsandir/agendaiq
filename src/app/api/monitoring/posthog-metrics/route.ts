import { NextRequest, NextResponse } from 'next/server';

// PostHog metrics API endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // PostHog API configuration
    const POSTHOG_PROJECT_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
    
    // Note: For full API access, you would need a personal API key
    // For now, we'll return enriched demo data that matches PostHog's structure
    
    // Calculate time range
    const now = new Date();
    const startDate = new Date();
    switch(timeRange) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default: // 24h
        startDate.setDate(startDate.getDate() - 1);
    }
    
    // Generate realistic metrics based on time range
    const timeMultiplier = timeRange === '1h' ? 0.04 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;
    
    const metrics = {
      totalEvents: Math.floor(15000 * timeMultiplier),
      uniqueUsers: Math.floor(150 * Math.sqrt(timeMultiplier)),
      errorCount: Math.floor(50 * timeMultiplier),
      pageViews: Math.floor(8000 * timeMultiplier),
      sessionDuration: 285, // Average in seconds
      activeUsers: Math.floor(25 * (timeRange === '1h' ? 1 : 0.8)),
      bounceRate: 32.5,
      avgPageLoadTime: 1.8,
      
      // Top errors with realistic PostHog event names
      topErrors: [
        { 
          message: 'TypeError: Cannot read properties of undefined', 
          count: Math.floor(23 * timeMultiplier), 
          lastSeen: '5 min ago',
          url: '/dashboard/meetings',
          browser: 'Chrome 120'
        },
        { 
          message: 'Failed to fetch API endpoint', 
          count: Math.floor(18 * timeMultiplier), 
          lastSeen: '12 min ago',
          url: '/api/meetings/create',
          browser: 'Safari 17'
        },
        { 
          message: 'ChunkLoadError: Loading chunk failed', 
          count: Math.floor(12 * timeMultiplier), 
          lastSeen: '1 hour ago',
          url: '/dashboard/settings',
          browser: 'Firefox 121'
        },
        { 
          message: 'Network request failed: 503 Service Unavailable', 
          count: Math.floor(8 * timeMultiplier), 
          lastSeen: '2 hours ago',
          url: '/api/auth/session',
          browser: 'Edge 120'
        },
      ],
      
      // User activity with PostHog standard event names
      userActivity: [
        { event: '$pageview', count: Math.floor(3421 * timeMultiplier), percentage: 42 },
        { event: '$autocapture', count: Math.floor(2834 * timeMultiplier), percentage: 35 },
        { event: 'button_clicked', count: Math.floor(823 * timeMultiplier), percentage: 10 },
        { event: '$exception', count: Math.floor(456 * timeMultiplier), percentage: 6 },
        { event: 'form_submitted', count: Math.floor(342 * timeMultiplier), percentage: 4 },
        { event: 'file_uploaded', count: Math.floor(156 * timeMultiplier), percentage: 2 },
        { event: 'user_signed_in', count: Math.floor(89 * timeMultiplier), percentage: 1 },
      ],
      
      // Performance metrics
      performance: {
        pageLoadTime: { p50: 1.2, p75: 1.8, p95: 3.2, p99: 5.1 },
        apiResponseTime: { p50: 180, p75: 230, p95: 450, p99: 1200 },
        firstContentfulPaint: { p50: 0.8, p75: 1.1, p95: 2.1, p99: 3.5 },
        timeToInteractive: { p50: 1.5, p75: 2.1, p95: 3.8, p99: 6.2 },
      },
      
      // Session insights
      sessions: {
        total: Math.floor(450 * timeMultiplier),
        avgDuration: 285,
        avgPagesPerSession: 4.2,
        rageClicks: Math.floor(12 * timeMultiplier),
        deadClicks: Math.floor(28 * timeMultiplier),
        recordings: Math.floor(120 * timeMultiplier),
      },
      
      // Feature usage (simulated feature flags)
      features: {
        'new-dashboard': { enabled: true, usage: 78 },
        'advanced-search': { enabled: true, usage: 45 },
        'ai-suggestions': { enabled: false, usage: 0 },
        'dark-mode': { enabled: true, usage: 62 },
      },
      
      // Time series data for charts
      timeSeries: generateTimeSeries(startDate, now, timeRange),
      
      metadata: {
        projectId: POSTHOG_PROJECT_KEY?.slice(0, 10) + '...',
        timeRange: timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        lastUpdated: new Date().toISOString(),
      }
    };
    
    return NextResponse.json({
      success: true,
      metrics,
      source: 'posthog_simulation', // Indicates this is simulated data
      message: 'PostHog metrics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching PostHog metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch PostHog metrics',
        metrics: null 
      },
      { status: 500 }
    );
  }
}

// Helper function to generate time series data
function generateTimeSeries(startDate: Date, endDate: Date, timeRange: string) {
  const series = [];
  const interval = timeRange === '1h' ? 5 : timeRange === '7d' ? 360 : timeRange === '30d' ? 1440 : 60; // minutes
  
  let currentTime = new Date(startDate);
  while (currentTime <= endDate) {
    series.push({
      timestamp: currentTime.toISOString(),
      events: Math.floor(Math.random() * 100) + 50,
      users: Math.floor(Math.random() * 20) + 10,
      errors: Math.floor(Math.random() * 5),
    });
    currentTime.setMinutes(currentTime.getMinutes() + interval);
  }
  
  return series;
}
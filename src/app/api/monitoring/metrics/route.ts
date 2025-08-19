import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Web Vitals metrics interface
interface WebVitalsMetric {
  name: string;
  id: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navigationType?: 'navigate' | 'reload' | 'back_forward' | 'prerender';
  timestamp?: string;
  url?: string;
  userAgent?: string;
}

// Web Vitals collector
const webVitalsBuffer: WebVitalsMetric[] = [];
const MAX_BUFFER_SIZE = 1000;

export async function POST(request: Request) {
  try {
    const metrics = await request.json() as WebVitalsMetric;
    
    // Add timestamp
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    
    const metricWithTime: WebVitalsMetric & {
      timestamp: string;
      userAgent: string;
      ip: string;
    } = {
      ...metrics,
      timestamp: new Date().toISOString(),
      userAgent,
      ip,
    };

    // Buffer metrics (in production, send to analytics service)
    webVitalsBuffer.push(metricWithTime);
    
    // Prevent memory overflow
    if (webVitalsBuffer.length > MAX_BUFFER_SIZE) {
      webVitalsBuffer.shift();
    }

    // Log critical metrics
    if (metrics.name === 'LCP' && metrics.value > 2500) {
      console.warn('Poor LCP detected:', metrics);
    }
    if (metrics.name === 'FID' && metrics.value > 100) {
      console.warn('Poor FID detected:', metrics);
    }
    if (metrics.name === 'CLS' && metrics.value > 0.1) {
      console.warn('Poor CLS detected:', metrics);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to collect metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Calculate aggregated metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      webVitals: {
        LCP: calculatePercentiles('LCP'),
        FID: calculatePercentiles('FID'),
        CLS: calculatePercentiles('CLS'),
        TTFB: calculatePercentiles('TTFB'),
        FCP: calculatePercentiles('FCP'),
      },
      application: await getApplicationMetrics(),
      database: await getDatabaseMetrics(),
    };

    return NextResponse.json(metrics);
  } catch (error: unknown) {
    console.error('Failed to get metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}

function calculatePercentiles(metricName: string) {
  const values = (webVitalsBuffer
    .filter(m => m.name === metricName)
    .map(m => m?.value)
    .sort((a, b) => a - b));

  if (values.length === 0) {
    return { p50: null, p75: null, p95: null, p99: null };
  }

  return {
    p50: values[Math.floor(values.length * 0.5)],
    p75: values[Math.floor(values.length * 0.75)],
    p95: values[Math.floor(values.length * 0.95)],
    p99: values[Math.floor(values.length * 0.99)],
    count: values.length,
  };
}

async function getApplicationMetrics() {
  return {
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
    },
    cpu: process.cpuUsage(),
  };
}

async function getDatabaseMetrics() {
  try {
    const [userCount, meetingCount, sessionCount] = await Promise.all([
      prisma.user.count(),
      prisma.meeting.count(),
      prisma.session.count(),
    ]);

    // Get database response time
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    return {
      userCount,
      meetingCount,
      sessionCount,
      responseTime,
      status: responseTime < 100 ? 'healthy' : 'slow',
    };
  } catch (error: unknown) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
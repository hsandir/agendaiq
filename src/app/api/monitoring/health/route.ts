import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public health check endpoint - no auth required for monitoring
export async function GET() {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    error: null as string | null,
    checks: {
      database: false,
      redis: false,
      auth: false,
      storage: false,
    },
    metrics: {
      responseTime: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      dbLatency: 0,
      totalChecks: 0,
      passedChecks: 0,
    }
  };

  try {
    // 1. Database check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = true;
    const dbTime = Date.now() - dbStart;

    // 2. Auth check (NextAuth readiness)
    health.checks.auth = !!process.env.NEXTAUTH_SECRET;

    // 3. Storage check (if using cloud storage)
    health.checks.storage = true; // Placeholder

    // 4. Redis check (if using)
    health.checks.redis = true; // Placeholder

    // Calculate total response time
    health.metrics.responseTime = Date.now() - startTime;

    // Determine overall health
    const allChecksPass = Object.values(health.checks).every(check => check);
    
    if (!allChecksPass) {
      health.status = 'degraded';
      
      // Critical service down
      if (!health.checks.database) {
        health.status = 'unhealthy';
      }
    }

    // Add performance metrics
    health.metrics = {
      ...health.metrics,
      dbLatency: dbTime,
      totalChecks: Object.keys(health.checks).length,
      passedChecks: Object.values(health.checks).filter(c => c).length,
    };

    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 503 : 500;

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    
    health.status = 'unhealthy';
    health.error = error instanceof Error ? error.message : 'Unknown error';
    health.metrics.responseTime = Date.now() - startTime;
    
    return NextResponse.json(health, { status: 500 });
  }
}
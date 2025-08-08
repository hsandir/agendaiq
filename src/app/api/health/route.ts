import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      database: 'pending',
      memory: 'pending',
      disk: 'pending',
    },
  };

  try {
    // Check database connection
    const startDb = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = `healthy (${Date.now() - startDb}ms)`;
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memLimit = 512 * 1024 * 1024; // 512MB
  if (memUsage.heapUsed > memLimit) {
    checks.checks.memory = `warning (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used)`;
    checks.status = 'degraded';
  } else {
    checks.checks.memory = `healthy (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used)`;
  }

  // Overall status
  const statusCode = checks.status === 'healthy' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}

// Readiness check for Kubernetes
export async function HEAD(request: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
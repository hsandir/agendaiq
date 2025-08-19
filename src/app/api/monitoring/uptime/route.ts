import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Secure uptime monitoring endpoint
 * Requires API key for access
 * Used by uptime monitoring services
 */
export async function GET(request: NextRequest) {
  // Check for monitoring API key
  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  
  // Verify API key
  const validApiKey = process.env?.MONITORING_API_KEY;
  
  if (!validApiKey ?? apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing API key' },
      { status: 401 }
    );
  }
  const startTime = Date.now();
  
  // Minimal response for uptime monitoring
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'agendaiq',
    version: process.env?.npm_package_version || '1.0.0',
    responseTime: 0
  };

  try {
    // Simple database connectivity check (no data exposed)
    await prisma.$queryRaw`SELECT 1`;
    response.status = 'healthy';
  } catch {
    // Don't expose error details
    response.status = 'degraded';
  }

  // Calculate response time
  response.responseTime = Date.now() - startTime;

  // Return appropriate status code
  const statusCode = response.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(response, { status: statusCode });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Simple database connectivity check
    let databaseConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch (error) {
      console.error('Database connection failed:', error);
    }

    const response = {
      health: {
        overall: databaseConnected ? 'healthy' : 'critical',
        issues: databaseConnected ? [] : ['Database connection failed'],
        warnings: []
      },
      database: {
        connected: databaseConnected,
        status: databaseConnected ? 'Connected' : 'Disconnected'
      },
      server: {
        running: true,
        port: 3000,
        uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown',
        memory: process.memoryUsage(),
        node_version: process.version
      },
      timestamp: new Date().toISOString(),
      message: 'Simplified system status - workflow and migration systems removed'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json({
      error: 'Failed to get system status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Simple database connectivity check
async function getDatabaseStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      status: 'Connected'
    };
  } catch (error) {
    return {
      connected: false,
      status: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 
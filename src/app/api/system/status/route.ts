import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// LIGHTWEIGHT: Cached response to prevent system overload
let cachedResponse: any = null;
let lastCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

export async function GET(request: NextRequest) {
  try {
    // Use cached response if available and recent
    const now = Date.now();
    if (cachedResponse && (now - lastCacheTime) < CACHE_DURATION) {
      return NextResponse.json(cachedResponse);
    }

    // LIGHTWEIGHT: Only essential checks to prevent system overload
    const [database] = await Promise.all([
      getDatabaseStatus()
    ]);

    const response = {
      health: {
        overall: database.connected ? 'healthy' : 'critical',
        issues: database.connected ? [] : ['Database connection failed'],
        warnings: []
      },
      packages: {
        total: 0, // Disabled: Heavy operation
        outdated: [],
        vulnerabilities: 0
      },
      database,
      server: {
        running: true,
        port: 3000,
        uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown',
        memory: process.memoryUsage ? process.memoryUsage() : null,
        node_version: process.version || 'unknown'
      },
      linting: {
        errors: 0, // Disabled: Heavy operation
        warnings: 0,
        files: []
      },
      dependencies: {
        missing: [], // Disabled: Heavy operation
        total: 0,
        suggestion: null
      },
      timestamp: new Date().toISOString(),
      cached: cachedResponse !== null,
      note: 'Lightweight mode - heavy operations disabled for performance'
    };

    // Cache the response
    cachedResponse = response;
    lastCacheTime = now;

    return NextResponse.json(response);

  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json({
      error: 'Failed to get system status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function getDatabaseStatus() {
  try {
    // Test basic connection first
    await prisma.$connect();
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test` as any[];
    
    if (result && result.length > 0) {
      // If basic query works, try to get table count
      try {
        const tables = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        ` as any[];
        
        await prisma.$disconnect();
        
        return {
          connected: true,
          status: 'PostgreSQL Connected',
          tables: Number(tables[0]?.count || 0)
        };
      } catch (tableError: any) {
        await prisma.$disconnect();
        return {
          connected: true,
          status: 'PostgreSQL Connected (Basic)',
          tables: 0,
          note: 'Could not get table count'
        };
      }
    }
    
    await prisma.$disconnect();
    return {
      connected: false,
      status: 'Database Connection Failed',
      error: 'Basic connection test failed',
      tables: 0
    };
  } catch (error: any) {
    return {
      connected: false,
      status: 'Database Connection Failed',
      error: error.message,
      tables: 0
    };
  }
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
} 
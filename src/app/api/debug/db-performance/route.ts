import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUltraFastUser } from '@/lib/auth/auth-utils-ultra-fast';

export async function GET() {
  try {
    // Check auth
    const user = await getUltraFastUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    interface TestResult {
      name: string;
      query: string;
      time: string;
      success: boolean;
    }
    
    const metrics: {
      timestamp: string;
      tests: TestResult[];
      summary?: Record<string, string | number>;
    } = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Simple connection test
    const connectionStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = performance.now() - connectionStart;
    metrics.tests.push({
      name: 'Connection Test',
      query: 'SELECT 1',
      time: connectionTime.toFixed(2) + 'ms',
      success: true
    });

    // Test 2: Simple user query
    const simpleQueryStart = performance.now();
    await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true }
    });
    const simpleQueryTime = performance.now() - simpleQueryStart;
    metrics.tests.push({
      name: 'Simple User Query',
      query: 'SELECT id, email FROM user WHERE id = ?',
      time: simpleQueryTime.toFixed(2) + 'ms',
      success: true
    });

    // Test 3: Count query
    const countStart = performance.now();
    const userCount = await prisma.user.count();
    const countTime = performance.now() - countStart;
    metrics.tests.push({
      name: 'Count Query',
      query: 'SELECT COUNT(*) FROM user',
      time: countTime.toFixed(2) + 'ms',
      success: true
    });

    // Test 4: Complex query with joins
    const complexStart = performance.now();
    await prisma.meeting.findFirst({
      include: {
        MeetingAttendee: {
          take: 5
        }
      }
    });
    const complexTime = performance.now() - complexStart;
    metrics.tests.push({
      name: 'Complex Query with Join',
      query: 'SELECT meeting with attendees (LIMITED)',
      time: complexTime.toFixed(2) + 'ms',
      success: true
    });

    // Test 5: Aggregation query
    const aggregationStart = performance.now();
    const meetingStats = await prisma.meeting.aggregate({
      _count: true,
      _max: {
        start_time: true
      },
      _min: {
        start_time: true
      }
    });
    const aggregationTime = performance.now() - aggregationStart;
    metrics.tests.push({
      name: 'Aggregation Query',
      query: 'Aggregate meeting statistics',
      time: aggregationTime.toFixed(2) + 'ms',
      success: true
    });

    // Test 6: Transaction test
    const transactionStart = performance.now();
    await prisma.$transaction(async (tx) => {
      await tx.user.findUnique({ where: { id: user.id } });
      await tx.meeting.count();
    });
    const transactionTime = performance.now() - transactionStart;
    metrics.tests.push({
      name: 'Transaction Test',
      query: 'Multiple queries in transaction',
      time: transactionTime.toFixed(2) + 'ms',
      success: true
    });

    // Test 7: Raw SQL query
    const rawStart = performance.now();
    await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Meeting" 
      WHERE start_time > ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
    `;
    const rawTime = performance.now() - rawStart;
    metrics.tests.push({
      name: 'Raw SQL Query',
      query: 'COUNT meetings in last 30 days',
      time: rawTime.toFixed(2) + 'ms',
      success: true
    });

    // Test 8: Index performance test
    const indexStart = performance.now();
    await prisma.meeting.findMany({
      where: {
        organizer_id: user.id,
        start_time: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: 10
    });
    const indexTime = performance.now() - indexStart;
    metrics.tests.push({
      name: 'Index Performance Test',
      query: 'Find meetings by organizer_id and start_time (uses index)',
      time: indexTime.toFixed(2) + 'ms',
      success: true
    });

    // Calculate statistics
    const times = metrics.tests.map(t => parseFloat(t.time));
    metrics.summary = {
      totalTests: metrics.tests.length,
      totalTime: times.reduce((a: number, b: number) => a + b, 0).toFixed(2) + 'ms',
      averageTime: (times.reduce((a: number, b: number) => a + b, 0) / times.length).toFixed(2) + 'ms',
      minTime: Math.min(...times).toFixed(2) + 'ms',
      maxTime: Math.max(...times).toFixed(2) + 'ms',
      connectionPoolStatus: 'active'
    };

    // Add response headers for caching
    const response = NextResponse.json(metrics);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('X-Database-Performance', 'measured');
    
    return response;
  } catch (error) {
    console.error('Database performance test error:', error);
    return NextResponse.json(
      { 
        error: 'Database performance test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get connection pool statistics
async function getConnectionPoolStatus() {
  try {
    // Get Prisma metrics
    const metrics = await (prisma as any).$metrics?.json();
    
    return {
      status: 'active',
      metrics: metrics || 'Metrics not available'
    };
  } catch (error) {
    return {
      status: 'unknown',
      error: 'Could not retrieve connection pool metrics'
    };
  }
}
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data for now - in production this would connect to GitHub Actions API
    const mockRuns = [
      {
        id: 'run-001',
        branch: 'main',
        commit: '1cd485f',
        author: 'Claude',
        message: 'feat: Implement Zero Degradation System with FileLocal Agent coordination',
        status: 'success' as const,
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        endTime: new Date(Date.now() - 60000), // 1 minute ago
        duration: 240000, // 4 minutes
        stages: [
          { name: 'Checkout', status: 'success' as const, duration: 30000 },
          { name: 'Install', status: 'success' as const, duration: 60000 },
          { name: 'Lint', status: 'success' as const, duration: 45000 },
          { name: 'Test', status: 'success' as const, duration: 90000 },
          { name: 'Build', status: 'success' as const, duration: 15000 }
        ]
      },
      {
        id: 'run-002', 
        branch: 'fix/database-relation-names',
        commit: 'f7626fa',
        author: 'System',
        message: 'Safe manual progress: Manual fixes reduced errors from 192 to 170',
        status: 'running' as const,
        startTime: new Date(Date.now() - 120000), // 2 minutes ago
        duration: 120000,
        stages: [
          { name: 'Checkout', status: 'success' as const, duration: 25000 },
          { name: 'Install', status: 'success' as const, duration: 55000 },
          { name: 'Lint', status: 'running' as const },
          { name: 'Test', status: 'pending' as const },
          { name: 'Build', status: 'pending' as const }
        ]
      }
    ];

    return NextResponse.json({
      runs: mockRuns,
      total: mockRuns.length
    });

  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline data' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import { can, Capability } from '@/lib/auth/policy';

// Vercel API integration for real deployment data
async function fetchVercelDeployments() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    console.warn('VERCEL_TOKEN or VERCEL_PROJECT_ID not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        next: { revalidate: 10 } // Cache for 10 seconds
      }
    );

    if (!response.ok) {
      console.error('Vercel API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Transform Vercel data to our format
    return data.deployments?.map((deployment: {
      target?: string;
      meta?: { githubCommitSha?: string };
      uid: string;
      state: string;
      created: number;
      creator?: { username?: string; email?: string };
      url?: string;
    }) => ({
      environment: deployment.target || 'production',
      version: deployment.meta?.githubCommitSha?.substring(0, 7) || deployment.uid.substring(0, 7),
      status: mapVercelStatus(deployment.state),
      deployedAt: new Date(deployment.created),
      deployedBy: deployment.creator?.username || deployment.creator?.email || 'unknown',
      url: deployment.url ? `https://${deployment.url}` : undefined,
      rollbackAvailable: deployment.state === 'READY'
    })) || [];
  } catch (error: unknown) {
    console.error('Failed to fetch Vercel deployments:', error);
    return [];
  }
}

function mapVercelStatus(state: string): 'success' | 'failed' | 'in_progress' {
  switch (state) {
    case 'READY':
      return 'success';
    case 'ERROR':
    case 'CANCELED':
      return 'failed';
    case 'BUILDING':
    case 'DEPLOYING':
    case 'INITIALIZING':
      return 'in_progress';
    default:
      return 'in_progress';
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check for CI/CD monitoring capability
    if (!can(user, Capability.DEV_CI)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch real deployment data from Vercel
    const deployments = await fetchVercelDeployments();

    return NextResponse.json({
      deployments,
      source: deployments.length > 0 ? 'vercel' : 'none',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployment data' },
      { status: 500 }
    );
  }
}
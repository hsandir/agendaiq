/**
 * Deployment Monitoring API Route
 * Fetches deployment data from Vercel
 * Following CLAUDE.md rules - Real-time data only, no mock data
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  creator: {
    username: string;
    email: string;
  };
  meta?: {
    githubCommitRef?: string;
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
  target?: string;
  aliasError?: string;
  aliasAssigned?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    // Get Vercel API token from environment
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;
    
    if (!vercelToken) {
      // Return empty data if no Vercel token is configured
      return NextResponse.json({
        deployments: [],
        message: 'Vercel integration not configured'
      });
    }

    try {
      // Fetch deployments from Vercel API
      const url = new URL('https://api.vercel.com/v6/deployments');
      if (vercelTeamId) {
        url.searchParams.append('teamId', vercelTeamId);
      }
      url.searchParams.append('limit', '10');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Vercel API error:', response.status, response.statusText);
        return NextResponse.json({
          deployments: [],
          message: 'Unable to fetch deployment data'
        });
      }

      const data = await response.json();
      const vercelDeployments: VercelDeployment[] = data.deployments || [];

      // Transform Vercel data to our format
      const deployments = vercelDeployments.map(deployment => ({
        environment: deployment.target || 'production',
        version: deployment.meta?.githubCommitSha?.substring(0, 7) || deployment.uid.substring(0, 7),
        status: mapVercelStatus(deployment.state),
        deployedAt: new Date(deployment.created),
        deployedBy: deployment.creator?.username || deployment.creator?.email || 'unknown',
        url: deployment.url ? `https://${deployment.url}` : undefined,
        rollbackAvailable: deployment.state === 'READY',
        message: deployment.meta?.githubCommitMessage || 'No message',
        branch: deployment.meta?.githubCommitRef || 'main'
      }));

      return NextResponse.json({ deployments });
    } catch (vercelError) {
      console.error('Vercel API error:', vercelError);
      // Return empty data if Vercel API fails
      return NextResponse.json({
        deployments: [],
        message: 'Unable to fetch deployment data'
      });
    }
  } catch (error) {
    console.error('Deployment monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployment data' },
      { status: 500 }
    );
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
    case 'INITIALIZING':
    case 'QUEUED':
      return 'in_progress';
    default:
      return 'in_progress';
  }
}
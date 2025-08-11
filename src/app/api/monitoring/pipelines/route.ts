import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import { can, Capability } from '@/lib/auth/policy';

// GitHub Actions API types
interface GitHubWorkflowRun {
  id: number;
  head_branch: string;
  head_sha: string;
  actor?: { login: string };
  head_commit?: { message: string };
  display_title: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  run_started_at: string | null;
}

interface GitHubWorkflowRunsResponse {
  workflow_runs: GitHubWorkflowRun[];
}

interface PipelineStage {
  name: string;
  status: string;
  duration: number;
}

// GitHub Actions API integration for real pipeline data
async function fetchGitHubPipelines() {
  const owner = process.env.GITHUB_OWNER || 'anthropics';
  const repo = process.env.GITHUB_REPO || 'agendaiq';
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn('GITHUB_TOKEN not configured, returning empty data');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        next: { revalidate: 10 } // Cache for 10 seconds
      }
    );

    if (!response.ok) {
      console.error('GitHub API error:', response.status);
      return [];
    }

    const data = await response.json() as GitHubWorkflowRunsResponse;
    
    // Transform GitHub Actions data to our format
    return data.workflow_runs?.slice(0, 10).map((run: GitHubWorkflowRun) => ({
      id: run.id.toString(),
      branch: run.head_branch,
      commit: run.head_sha,
      author: run.actor?.login || 'unknown',
      message: run.head_commit?.message || run.display_title,
      status: mapGitHubStatus(run.status, run.conclusion),
      startTime: run.created_at,
      endTime: run.updated_at,
      duration: run.run_started_at ? 
        new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime() : 
        undefined,
      stages: extractStages(run),
    })) || [];
  } catch (error) {
    console.error('Failed to fetch GitHub pipelines:', error);
    return [];
  }
}

function mapGitHubStatus(status: string, conclusion: string | null): string {
  if (status === 'completed') {
    switch (conclusion) {
      case 'success': return 'success';
      case 'failure': return 'failed';
      case 'cancelled': return 'cancelled';
      default: return 'failed';
    }
  }
  if (status === 'in_progress') return 'running';
  if (status === 'queued') return 'pending';
  return 'pending';
}

function extractStages(run: GitHubWorkflowRun): PipelineStage[] {
  // Basic stage mapping - in real implementation, fetch jobs for detailed stages
  const stages = [];
  
  if (run.status === 'completed') {
    stages.push({
      name: 'Checkout',
      status: 'success',
      duration: 2000
    });
    
    stages.push({
      name: 'Build',
      status: run.conclusion === 'success' ? 'success' : 'failed',
      duration: 45000
    });
    
    if (run.conclusion === 'success') {
      stages.push({
        name: 'Test',
        status: 'success',
        duration: 60000
      });
      
      stages.push({
        name: 'Deploy',
        status: 'success',
        duration: 30000
      });
    }
  } else if (run.status === 'in_progress') {
    stages.push({
      name: 'Checkout',
      status: 'success',
      duration: 2000
    });
    
    stages.push({
      name: 'Build',
      status: 'running',
      duration: 0
    });
    
    stages.push({
      name: 'Test',
      status: 'pending',
      duration: 0
    });
    
    stages.push({
      name: 'Deploy',
      status: 'pending',
      duration: 0
    });
  } else {
    stages.push({
      name: 'Checkout',
      status: 'pending',
      duration: 0
    });
    
    stages.push({
      name: 'Build',
      status: 'pending',
      duration: 0
    });
    
    stages.push({
      name: 'Test',
      status: 'pending',
      duration: 0
    });
    
    stages.push({
      name: 'Deploy',
      status: 'pending',
      duration: 0
    });
  }
  
  return stages;
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

    // Fetch real pipeline data from GitHub Actions
    const runs = await fetchGitHubPipelines();

    return NextResponse.json({
      runs,
      source: runs.length > 0 ? 'github' : 'none',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline data' },
      { status: 500 }
    );
  }
}
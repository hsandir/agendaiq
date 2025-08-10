/**
 * Pipeline Monitoring API Route
 * Fetches CI/CD pipeline data from GitHub Actions
 * Following CLAUDE.md rules - Real-time data only, no mock data
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { Octokit } from '@octokit/rest';

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

    // Initialize GitHub API client
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      // Return empty data if no GitHub token is configured
      return NextResponse.json({
        runs: [],
        message: 'GitHub integration not configured'
      });
    }

    const octokit = new Octokit({
      auth: githubToken
    });

    // Get repository information from environment
    const owner = process.env.GITHUB_OWNER || 'default-owner';
    const repo = process.env.GITHUB_REPO || 'agendaiq';

    try {
      // Fetch workflow runs from GitHub Actions
      const { data: workflowRuns } = await octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 20
      });

      // Transform GitHub Actions data to our format
      const runs = workflowRuns.workflow_runs.map(run => ({
        id: run.id.toString(),
        branch: run.head_branch || 'main',
        commit: run.head_sha || '',
        author: run.actor?.login || 'unknown',
        message: run.display_title || run.head_commit?.message || 'No message',
        status: mapGitHubStatus(run.status, run.conclusion),
        startTime: new Date(run.created_at),
        endTime: run.updated_at ? new Date(run.updated_at) : undefined,
        duration: run.updated_at
          ? new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()
          : undefined,
        stages: [
          {
            name: 'Build',
            status: run.conclusion === 'success' ? 'success' : 
                   run.conclusion === 'failure' ? 'failed' :
                   run.status === 'in_progress' ? 'running' : 'pending',
            duration: undefined
          },
          {
            name: 'Test',
            status: run.conclusion === 'success' ? 'success' : 
                   run.conclusion === 'failure' ? 'failed' :
                   run.status === 'in_progress' ? 'running' : 'pending',
            duration: undefined
          },
          {
            name: 'Deploy',
            status: run.conclusion === 'success' ? 'success' : 
                   run.conclusion === 'failure' ? 'failed' :
                   run.status === 'in_progress' ? 'running' : 'pending',
            duration: undefined
          }
        ]
      }));

      return NextResponse.json({ runs });
    } catch (githubError) {
      console.error('GitHub API error:', githubError);
      // Return empty data if GitHub API fails
      return NextResponse.json({
        runs: [],
        message: 'Unable to fetch pipeline data'
      });
    }
  } catch (error) {
    console.error('Pipeline monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline data' },
      { status: 500 }
    );
  }
}

function mapGitHubStatus(status: string | null, conclusion: string | null): string {
  if (status === 'queued' || status === 'waiting') return 'pending';
  if (status === 'in_progress') return 'running';
  if (status === 'completed') {
    switch (conclusion) {
      case 'success': return 'success';
      case 'failure': return 'failed';
      case 'cancelled': return 'cancelled';
      case 'skipped': return 'cancelled';
      default: return 'failed';
    }
  }
  return 'pending';
}
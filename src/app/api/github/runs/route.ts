import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }
    
    const { searchParams } = new URL(request.url);
    const workflow_id = searchParams.get('workflow_id');
    const status = searchParams.get('status'); // queued, in_progress, completed
    const per_page = searchParams.get('per_page') ?? '10';
    
    let url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=${per_page}`;
    
    if (workflow_id) {
      url += `&workflow_id=${workflow_id}`;
    }
    
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      workflow_runs: data.workflow_runs.map((run: {
        id: number;
        name: string;
        status: string;
        conclusion: string | null;
        workflow_id: number;
        created_at: string;
        updated_at: string;
        html_url: string;
        head_branch: string;
        head_sha: string;
        run_number: number;
        event: string
      }) => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        workflow_id: run.workflow_id,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url,
        head_branch: run.head_branch,
        head_sha: run.head_sha,
        run_number: run.run_number,
        event: run.event,
      })),
      total_count: data.total_count
    });
  } catch (error: unknown) {
    console.error('GitHub API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs' },
      { status: 500 }
    );
  }
}
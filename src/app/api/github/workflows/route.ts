import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

export async function GET() {
  try {
    // Auth check - development capability required
    await requireAuth(AuthPresets.requireDevelopment);
    
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return NextResponse.json(
        { error: 'GitHub configuration missing' },
        { status: 500 }
      );
    }

    // List workflows
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      workflows: data.workflows,
      total_count: data.total_count
    });
  } catch (error) {
    console.error('GitHub API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check - development capability required
    await requireAuth(AuthPresets.requireDevelopment);
    
    const { workflow_id, ref = 'main', inputs = {} } = await request.json();
    
    if (!workflow_id) {
      return NextResponse.json(
        { error: 'workflow_id is required' },
        { status: 400 }
      );
    }

    // Trigger workflow
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflow_id}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref,
          inputs
        }),
      }
    );

    if (response.status === 204) {
      return NextResponse.json({ 
        success: true, 
        message: 'Workflow triggered successfully' 
      });
    }

    throw new Error(`GitHub API error: ${response.statusText}`);
  } catch (error) {
    console.error('GitHub workflow trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger workflow' },
      { status: 500 }
    );
  }
}
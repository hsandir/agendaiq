import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';

// Schema for query parameters
// const querySchema = z.object({
//   limit: z.string().optional().transform(val => val ? parseInt(val) : 30),
//   status: z.enum(['completed', 'in_progress', 'queued', 'failure', 'success', 'all']).optional(),
//   branch: z.string().optional(),
// });

// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'hsandir';
const GITHUB_REPO = process.env.GITHUB_REPO || 'agendaiq';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  workflow_id: number;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  run_number: number;
  event: string;
  run_attempt: number;
}

interface WorkflowJob {
  id: number;
  run_id: number;
  status: string;
  conclusion: string | null;
  name: string;
  steps: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    number: number;
    started_at: string | null;
    completed_at: string | null;
  }>;
  started_at: string;
  completed_at: string | null;
  html_url: string;
}

// Removed mock data - require real GitHub token
/* function getMockData() {
  const mockRuns: WorkflowRun[] = [
    {
      id: 1,
      name: 'CI Pipeline',
      head_branch: 'main',
      head_sha: 'abc123',
      status: 'completed',
      conclusion: 'success',
      workflow_id: 1,
      url: '#',
      html_url: 'https://github.com/hsandir/agendaiq/actions/runs/1',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3000000).toISOString(),
      actor: {
        login: 'developer',
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
      run_number: 100,
      event: 'push',
      run_attempt: 1,
    },
    {
      id: 2,
      name: 'Deploy to Production',
      head_branch: 'main',
      head_sha: 'def456',
      status: 'completed',
      conclusion: 'failure',
      workflow_id: 2,
      url: '#',
      html_url: 'https://github.com/hsandir/agendaiq/actions/runs/2',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 6600000).toISOString(),
      actor: {
        login: 'developer',
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
      run_number: 99,
      event: 'push',
      run_attempt: 1,
    },
    {
      id: 3,
      name: 'CI Pipeline',
      head_branch: 'feature/new-feature',
      head_sha: 'ghi789',
      status: 'in_progress',
      conclusion: null,
      workflow_id: 1,
      url: '#',
      html_url: 'https://github.com/hsandir/agendaiq/actions/runs/3',
      created_at: new Date(Date.now() - 300000).toISOString(),
      updated_at: new Date().toISOString(),
      actor: {
        login: 'developer',
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
      run_number: 101,
      event: 'pull_request',
      run_attempt: 1,
    },
  ];

  // Add mock failed jobs for the failed run
  const failedRuns = (mockRuns.filter(r => r.conclusion === 'failure').map(run => ({
    ...run,
    failedJobs: [
      {
        id: 1001,
        name: 'Build',
        conclusion: 'failure',
        html_url: '#',
        logs: 'Error: Cannot find module \'@/components/missing-component\'\nTypeError: Cannot read property \'undefined\' of undefined',
        failedSteps: [
          { name: 'Install dependencies', conclusion: 'success' },
          { name: 'Build application', conclusion: 'failure' },
        ],
      },
    ],
  })));

  const successfulRuns = mockRuns.filter(r => r.conclusion !== 'failure');
  const allRuns = [...failedRuns, ...successfulRuns].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    runs: allRuns,
    stats: {
      total: allRuns.length,
      successful: allRuns.filter(r => r.conclusion === 'success').length,
      failed: allRuns.filter(r => r.conclusion === 'failure').length,
      inProgress: allRuns.filter(r => r.status === 'in_progress').length,
      queued: 0,
      successRate: '66.7',
      averageDuration: '5m 30s',
      commonErrors: {
        'Module Not Found': 1,
        'Type Error': 1,
      },
    },
  };
} */

// GET /api/dev/ci-cd/runs - Get workflow runs and their status
export async function GET(request: NextRequest) {
  try {
    // Development tools should be accessible without auth in dev mode
    // The /api/dev/* routes are specifically for development
    // In production, these endpoints should be disabled or protected
    console.log('CI/CD API called, NODE_ENV:', process.env.NODE_ENV);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      limit: parseInt(searchParams.get('limit') || '30'),
      status: searchParams.get('status') || 'all',
      branch: searchParams.get('branch') || undefined,
    };

    // Check if GitHub token is configured
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { 
          error: 'GitHub token not configured',
          message: 'Please configure GITHUB_TOKEN in your environment variables to use CI/CD monitoring',
          code: 'MISSING_GITHUB_TOKEN'
        },
        { status: 503 }
      );
    }
    
    /* Removed mock data logic */

    // Fetch workflow runs from GitHub
    const runsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=${params.limit}${params.branch ? `&branch=${params.branch}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!runsResponse.ok) {
      throw new Error(`GitHub API error: ${runsResponse.statusText}`);
    }

    const runsData = await runsResponse.json();
    let runs: WorkflowRun[] = runsData.workflow_runs;

    // Filter by status if specified
    if (params.status && params.status !== 'all') {
      if (params.status === 'failure') {
        runs = runs.filter(run => run.conclusion === 'failure');
      } else if (params.status === 'success') {
        runs = runs.filter(run => run.conclusion === 'success');
      } else {
        runs = runs.filter(run => run.status === params.status);
      }
    }

    // Fetch failed jobs details for failed runs
    const failedRuns = runs.filter(run => run.conclusion === 'failure');
    const failedRunsWithDetails = (await Promise.all(
      failedRuns.slice(0, 10).map(async (run) => {
        try {
          const jobsResponse = await fetch(
            `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${run.id}/jobs`,
            {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );

          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            const failedJobs = jobsData.jobs.filter((job: WorkflowJob) => 
              job.conclusion === 'failure'
            );

            // Get logs for failed jobs
            const jobsWithLogs = (await Promise.all(
              failedJobs.map(async (job: WorkflowJob) => {
                try {
                  const logsResponse = await fetch(
                    `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/jobs/${job.id}/logs`,
                    {
                      headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                      },
                    }
                  );

                  let logs = '';
                  if (logsResponse.ok) {
                    logs = await logsResponse.text();
                    // Extract error lines (last 50 lines)
                    const lines = logs.split('\n');
                    const errorLines = lines.slice(-50).join('\n');
                    logs = errorLines;
                  }

                  return {
                    ...job,
                    logs,
                    failedSteps: job.steps.filter(step => step.conclusion === 'failure'),
                  };
                } catch (error: unknown) {
                  console.error(`Failed to fetch logs for job ${job.id}:`, error);
                  return {
                    ...job,
                    logs: '',
                    failedSteps: job.steps.filter(step => step.conclusion === 'failure'),
                  };
                }
              })
            ));

            return {
              ...run,
              failedJobs: jobsWithLogs,
            };
          }

          return {
            ...run,
            failedJobs: [],
          };
        } catch (error: unknown) {
          console.error(`Failed to fetch jobs for run ${run.id}:`, error);
          return {
            ...run,
            failedJobs: [],
          };
        }
      })
    ));

    // Analyze common error patterns
    const errorPatterns = analyzeErrorPatterns(failedRunsWithDetails);

    // Generate statistics
    const stats = {
      total: runs.length,
      successful: runs.filter(r => r.conclusion === 'success').length,
      failed: runs.filter(r => r.conclusion === 'failure').length,
      inProgress: runs.filter(r => r.status === 'in_progress').length,
      queued: runs.filter(r => r.status === 'queued').length,
      successRate: runs.length > 0 
        ? ((runs.filter(r => r.conclusion === 'success').length / runs.length) * 100).toFixed(1)
        : 0,
      averageDuration: calculateAverageDuration(runs),
      commonErrors: errorPatterns,
    };

    return NextResponse.json({
      runs: runs.map(run => ({
        ...run,
        failedJobs: failedRunsWithDetails.find(fr => fr.id === run.id)?.failedJobs || [],
      })),
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error fetching CI/CD runs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch CI/CD runs',
        code: 'CI_CD_FETCH_ERROR',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/dev/ci-cd/runs - Trigger workflow or retry failed run
export async function POST(request: NextRequest) {
  try {
    // Development endpoint - no auth required in dev mode
    console.log('CI/CD POST API called');

    const body = (await request.json()) as Record<string, unknown>;
    const { __action, __runId, __workflowId, branch = 'main'  } = body;

    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    if (action === 'retry' && runId) {
      // Retry a failed workflow run
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}/rerun`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to retry run: ${response.statusText}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Workflow run retry initiated',
        runId,
      });
    } else if (action === 'trigger' && workflowId) {
      // Trigger a new workflow run
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowId}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: branch,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to trigger workflow: ${response.statusText}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Workflow triggered successfully',
        workflowId,
        branch,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing parameters' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Error managing CI/CD run:', error);
    return NextResponse.json(
      {
        error: 'Failed to manage CI/CD run',
        code: 'CI_CD_ACTION_ERROR',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Helper function to analyze error patterns
function analyzeErrorPatterns(failedRuns: Array<{ failedJobs?: Array<{ logs?: string; failedSteps?: Array<{ name: string }> }> }>): Record<string, number> {
  const patterns: Record<string, number> = {};

  failedRuns.forEach(run => {
    run.failedJobs?.forEach((job) => {
      const logs = job.logs || '';
      
      // Common error patterns
      const errorTypes = [
        { pattern: /npm ERR!/gi, type: 'NPM Error' },
        { pattern: /TypeError:/gi, type: 'Type Error' },
        { pattern: /SyntaxError:/gi, type: 'Syntax Error' },
        { pattern: /Cannot find module/gi, type: 'Module Not Found' },
        { pattern: /Test failed/gi, type: 'Test Failure' },
        { pattern: /Build failed/gi, type: 'Build Failure' },
        { pattern: /Lint error/gi, type: 'Lint Error' },
        { pattern: /Type check failed/gi, type: 'TypeScript Error' },
        { pattern: /Connection refused/gi, type: 'Connection Error' },
        { pattern: /Permission denied/gi, type: 'Permission Error' },
        { pattern: /Out of memory/gi, type: 'Memory Error' },
        { pattern: /Timeout/gi, type: 'Timeout Error' },
      ];

      errorTypes.forEach(({ pattern, type }) => {
        if (pattern.test(logs)) {
          patterns[type] = (patterns[type] || 0) + 1;
        }
      });

      // Check failed steps
      job.failedSteps?.forEach((step) => {
        const stepName = step.name.toLowerCase();
        if (stepName.includes('test')) {
          patterns['Test Step Failure'] = (patterns['Test Step Failure'] || 0) + 1;
        } else if (stepName.includes('build')) {
          patterns['Build Step Failure'] = (patterns['Build Step Failure'] || 0) + 1;
        } else if (stepName.includes('lint')) {
          patterns['Lint Step Failure'] = (patterns['Lint Step Failure'] || 0) + 1;
        }
      });
    });
  });

  return patterns;
}

// Helper function to calculate average duration
function calculateAverageDuration(runs: WorkflowRun[]): string {
  const completedRuns = runs.filter(run => run.conclusion);
  if (completedRuns.length === 0) return '0m';

  const totalDuration = completedRuns.reduce((sum, run) => {
    const start = new Date(run.created_at).getTime();
    const end = new Date(run.updated_at).getTime();
    return sum + (end - start);
  }, 0);

  const avgMs = totalDuration / completedRuns.length;
  const minutes = Math.floor(avgMs / 60000));
  const seconds = Math.floor((avgMs % 60000) / 1000));

  return `${minutes}m ${seconds}s`;
}
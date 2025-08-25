/**
 * Mock type definitions for @octokit/rest
 * Used in test files to ensure type safety when mocking Octokit
 */

export interface MockWorkflowRun {
  id: number;
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  created_at: string;
  updated_at: string;
  status?: 'queued' | 'in_progress' | 'completed';
  workflow_id?: number;
  head_branch?: string;
  head_sha?: string;
  run_number?: number;
}

export interface MockWorkflowRunsResponse {
  total_count: number;
  workflow_runs: MockWorkflowRun[];
}

export interface MockArtifact {
  id?: number;
  name: string;
  size: number;
  url?: string;
  archive_download_url?: string;
  expired?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MockArtifactsResponse {
  total_count?: number;
  artifacts: MockArtifact[];
}

export interface MockOctokitActions {
  listWorkflowRunsForRepo: jest.MockedFunction<() => Promise<{ data: MockWorkflowRunsResponse }>>;
  listWorkflowRunArtifacts?: jest.MockedFunction<() => Promise<{ data: MockArtifactsResponse }>>;
}

export interface MockOctokit {
  actions: MockOctokitActions;
}

export type MockOctokitConstructor = jest.MockedClass<new () => MockOctokit>;

/**
 * Type-safe way to get the mocked Octokit constructor
 */
export function getMockOctokit(): MockOctokitConstructor {
  const mockModule = jest.requireMock('@octokit/rest') as Record<string, unknown> as { Octokit: MockOctokitConstructor };
  return mockModule.Octokit;
}

/**
 * Type-safe way to create a mock Octokit instance
 */
export function createMockOctokitInstance(actions: Partial<MockOctokitActions> = {}): MockOctokit {
  return {
    actions: {
      listWorkflowRunsForRepo: jest.fn(),
      listWorkflowRunArtifacts: jest.fn(),
      ...actions,
    },
  };
}
/**
 * CICDMonitor Component Tests
 * Tests for CI/CD monitoring dashboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CICDMonitor } from '@/components/monitoring/CICDMonitor';
import '@testing-library/jest-dom';

// Mock the ErrorMonitor component
jest.mock('@/components/monitoring/ErrorMonitor', () => ({
  ErrorMonitor: () => <div data-testid="error-monitor">Error Monitor Component</div>
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('CICDMonitor Component', () => {
  // Shared mock function for API responses
  const mockApiResponses = (): void => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          runs: [
            {
              id: '1',
              branch: 'main',
              commit: 'abc123',
              author: 'testuser',
              message: 'Test commit',
              status: 'success',
              startTime: new Date().toISOString(),
              duration: 300000,
              stages: [
                { name: 'Build', status: 'success' },
                { name: 'Test', status: 'success' },
                { name: 'Deploy', status: 'success' }
              ]
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deployments: [
            {
              environment: 'production',
              version: '1.0.0',
              status: 'success',
              deployedAt: new Date().toISOString(),
              deployedBy: 'deployuser',
              url: 'https://example.com',
              rollbackAvailable: true
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          metrics: {
            totalBuilds: 100,
            successRate: 95,
            averageDuration: 300000,
            queueTime: 30000,
            testsPassed: 150,
            testsFailed: 5,
            codeCoverage: 85,
            vulnerabilities: 0
          }
        })
      });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Loading', () => {
    it('should show loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<CICDMonitor />);
      expect(screen.getByText('Loading CI/CD data...')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {

    it('should fetch and display pipeline data', async () => {
      mockApiResponses();

      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('main')).toBeInTheDocument();
        expect(screen.getByText('Test commit')).toBeInTheDocument();
        expect(screen.getByText('testuser', { exact: false })).toBeInTheDocument();
      });
    });

    it('should fetch and display deployment data', async () => {
      mockApiResponses();

      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('production')).toBeInTheDocument();
        expect(screen.getByText('1.0.0')).toBeInTheDocument();
        expect(screen.getByText('deployuser', { exact: false })).toBeInTheDocument();
      });
    });

    it('should fetch and display build metrics', async () => {
      mockApiResponses();

      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('95.0%')).toBeInTheDocument(); // Success rate
        expect(screen.getByText('85.0%')).toBeInTheDocument(); // Code coverage
        expect(screen.getByText('150 passed, 5 failed')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<CICDMonitor />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch CI/CD data:', expect.any(Error));
      });

      (consoleSpy as jest.Mock).mockRestore();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockApiResponses();
    });

    it('should display pipelines tab by default', async () => {
      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
        expect(screen.queryByTestId('error-monitor')).not.toBeInTheDocument();
      });
    });

    it('should switch to error monitoring tab when clicked', async () => {
      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
      });

      const errorTab = screen.getByRole('button', { name: /Error Monitoring/i });
      fireEvent.click(errorTab);

      expect(screen.queryByText('Recent Pipeline Runs')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-monitor')).toBeInTheDocument();
    });

    it('should switch back to pipelines tab', async () => {
      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
      });

      const errorTab = screen.getByRole('button', { name: /Error Monitoring/i });
      fireEvent.click(errorTab);
      
      const pipelineTab = screen.getByRole('button', { name: /CI\/CD Pipelines/i });
      fireEvent.click(pipelineTab);

      expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
      expect(screen.queryByTestId('error-monitor')).not.toBeInTheDocument();
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      mockApiResponses();
    });

    it('should auto-refresh data every 10 seconds when enabled', async () => {
      const fetchSpy = global.fetch as jest.Mock;
      (fetchSpy as jest.Mock).mockClear();

      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
      });

      expect(fetchSpy).toHaveBeenCalledTimes(3); // Initial fetch

      // Mock responses for refresh
      mockApiResponses();

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(6); // Another 3 calls
      });
    });

    it('should stop auto-refresh when disabled', async () => {
      const fetchSpy = global.fetch as jest.Mock;
      
      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
      });

      (fetchSpy as jest.Mock).mockClear();

      // Click stop auto-refresh
      const stopButton = screen.getByRole('button', { name: /Stop Auto-refresh/i });
      fireEvent.click(stopButton);

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(fetchSpy).not.toHaveBeenCalled();
      });
    });

    it('should manually refresh when refresh button is clicked', async () => {
      const fetchSpy = global.fetch as jest.Mock;

      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
      });

      (fetchSpy as jest.Mock).mockClear();
      mockApiResponses();

      const refreshButton = screen.getByRole('button', { name: /^Refresh$/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Pipeline Details', () => {
    beforeEach(() => {
      mockApiResponses();
    });

    it('should show pipeline details when a pipeline is clicked', async () => {
      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Test commit')).toBeInTheDocument();
      });

      const pipelineRow = screen.getByText('Test commit').closest('div[class*="cursor-pointer"]');
      fireEvent.click(pipelineRow!);

      expect(screen.getByText('Pipeline Details:')).toBeInTheDocument();
      expect(screen.getByText('Branch: main • Commit: abc123')).toBeInTheDocument();
    });

    it('should close pipeline details when close button is clicked', async () => {
      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Test commit')).toBeInTheDocument();
      });

      const pipelineRow = screen.getByText('Test commit').closest('div[class*="cursor-pointer"]');
      fireEvent.click(pipelineRow!);

      const closeButton = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Pipeline Details:')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state for pipelines', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ runs: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ deployments: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ metrics: null })
        });

      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('No pipeline runs found. Push a commit to trigger a build.')).toBeInTheDocument();
        expect(screen.getByText('No deployments found.')).toBeInTheDocument();
      });
    });
  });

  describe('Status Indicators', () => {
    it('should display correct status icons and badges', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            runs: [
              {
                id: '1',
                branch: 'main',
                commit: 'abc123',
                author: 'user1',
                message: 'Success run',
                status: 'success',
                startTime: new Date().toISOString(),
                stages: []
              },
              {
                id: '2',
                branch: 'feature',
                commit: 'def456',
                author: 'user2',
                message: 'Failed run',
                status: 'failed',
                startTime: new Date().toISOString(),
                stages: []
              },
              {
                id: '3',
                branch: 'develop',
                commit: 'ghi789',
                author: 'user3',
                message: 'Running',
                status: 'running',
                startTime: new Date().toISOString(),
                stages: []
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ deployments: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ metrics: null })
        });

      render(<CICDMonitor />);

      await waitFor(() => {
        expect(screen.getByText('SUCCESS')).toBeInTheDocument();
        expect(screen.getByText('FAILED')).toBeInTheDocument();
        expect(screen.getByText('RUNNING')).toBeInTheDocument();
      });
    });
  });
});
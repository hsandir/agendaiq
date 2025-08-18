/**
 * ErrorMonitor Component Tests
 * Tests for error monitoring dashboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorMonitor } from '@/components/monitoring/ErrorMonitor';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

describe('ErrorMonitor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockApiResponses = () => {
    (global.fetch as jest.Mock)
      // Error issues response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [
            {
              id: '1',
              title: 'TypeError: Cannot read property',
              culprit: 'src/components/Test.tsx',
              level: 'error',
              count: 45,
              userCount: 12,
              firstSeen: new Date(Date.now() - 86400000),
              lastSeen: new Date(Date.now() - 3600000),
              status: 'unresolved',
              isRegression: false,
              platform: 'javascript',
              release: '1.0.0'
            },
            {
              id: '2',
              title: 'Warning: Component is changing',
              culprit: 'src/components/Form.tsx',
              level: 'warning',
              count: 23,
              userCount: 8,
              firstSeen: new Date(Date.now() - 172800000),
              lastSeen: new Date(Date.now() - 7200000),
              status: 'unresolved',
              isRegression: true,
              platform: 'javascript'
            }
          ]
        })
      })
      // Error stats response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: {
            crashFreeUsers: 99.5,
            crashFreeSessions: 99.0,
            errorRate: 0.2,
            activeIssues: 15,
            newIssues24h: 3,
            resolvedIssues24h: 5,
            p95ResponseTime: 450,
            affectedUsers: 50
          }
        })
      })
      // Release health response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          release: {
            version: '1.0.0+abc123',
            adoptionRate: 85,
            crashFreeRate: 99.2,
            sessionCount: 5000,
            errorCount: 42,
            newIssues: 2,
            status: 'healthy'
          }
        })
      });
  };

  describe('Initial Loading', () => {
    it('should show loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<ErrorMonitor />);
      expect(screen.getByText('Loading error monitoring data...')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display error statistics', async () => {
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('99.50%')).toBeInTheDocument(); // Crash-free users
        expect(screen.getByText('0.20%')).toBeInTheDocument(); // Error rate
        expect(screen.getByText('15')).toBeInTheDocument(); // Active issues
        expect(screen.getByText('450ms')).toBeInTheDocument(); // p95 response time
      });
    });

    it('should display release health information', async () => {
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('1.0.0+abc123')).toBeInTheDocument();
        expect(screen.getByText('85.0%')).toBeInTheDocument(); // Adoption rate
        expect(screen.getByText('99.20%')).toBeInTheDocument(); // Crash-free rate
        expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      });
    });

    it('should display error issues list', async () => {
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('TypeError: Cannot read property')).toBeInTheDocument();
        expect(screen.getByText('src/components/Test.tsx')).toBeInTheDocument();
        expect(screen.getByText('12 users')).toBeInTheDocument();
        expect(screen.getByText('45 events')).toBeInTheDocument();
      });
    });

    it('should show regression badge for regression issues', async () => {
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('REGRESSION')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter issues by level', async () => {
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('TypeError: Cannot read property')).toBeInTheDocument();
      });

      // Change filter to errors only
      const filterSelect = screen.getByRole('combobox');
      fireEvent.change(filterSelect, { target: { value: 'error' } });

      // Mock filtered response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            issues: [
              {
                id: '1',
                title: 'TypeError: Cannot read property',
                culprit: 'src/components/Test.tsx',
                level: 'error',
                count: 45,
                userCount: 12,
                firstSeen: new Date(),
                lastSeen: new Date(),
                status: 'unresolved',
                isRegression: false
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ stats: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ release: {} })
        });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('?level=error'),
          undefined
        );
      });
    });
  });

  describe('Auto-refresh', () => {
    it('should auto-refresh data every 30 seconds when enabled', async () => {
      const fetchSpy = global.fetch as jest.Mock;
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Active Error Issues')).toBeInTheDocument();
      });

      (fetchSpy as jest.Mock).mockClear();
      mockApiResponses();

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(3); // 3 API calls for refresh
      });
    });

    it('should stop auto-refresh when toggled off', async () => {
      const fetchSpy = global.fetch as jest.Mock;
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Active Error Issues')).toBeInTheDocument();
      });

      // Toggle auto-refresh off
      const autoRefreshButton = screen.getByRole('button', { name: /Auto/i });
      fireEvent.click(autoRefreshButton);

      (fetchSpy as jest.Mock).mockClear();

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should manually refresh when refresh button is clicked', async () => {
      const fetchSpy = global.fetch as jest.Mock;
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('Active Error Issues')).toBeInTheDocument();
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

  describe('Issue Details', () => {
    it('should show issue details when an issue is clicked', async () => {
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('TypeError: Cannot read property')).toBeInTheDocument();
      });

      const issueRow = screen.getByText('TypeError: Cannot read property').closest('div[class*="cursor-pointer"]');
      fireEvent.click(issueRow!);

      expect(screen.getByText('Issue Details:')).toBeInTheDocument();
      expect(screen.getByText(/Location: src\/components\/Test\.tsx/)).toBeInTheDocument();
      expect(screen.getByText(/Impact: 12 users, 45 occurrences/)).toBeInTheDocument();
    });

    it('should close issue details when close button is clicked', async () => {
      mockApiResponses();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('TypeError: Cannot read property')).toBeInTheDocument();
      });

      const issueRow = screen.getByText('TypeError: Cannot read property').closest('div[class*="cursor-pointer"]');
      fireEvent.click(issueRow!);

      const closeButton = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Issue Details:')).not.toBeInTheDocument();
    });
  });

  describe('Health Indicators', () => {
    it('should show correct health icons based on metrics', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ issues: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            stats: {
              crashFreeUsers: 98.0, // Below 99, should show warning
              errorRate: 2.0, // Above 1, should show error
              activeIssues: 0,
              newIssues24h: 0,
              resolvedIssues24h: 0,
              p95ResponseTime: 1500, // Above 500ms, should show error
              affectedUsers: 200
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            release: {
              version: '1.0.0',
              status: 'degraded',
              adoptionRate: 50,
              crashFreeRate: 98.0,
              sessionCount: 1000,
              errorCount: 100,
              newIssues: 10
            }
          })
        });

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('98.00%')).toBeInTheDocument(); // Crash-free users
        expect(screen.getByText('2.00%')).toBeInTheDocument(); // Error rate
        expect(screen.getByText('DEGRADED')).toBeInTheDocument(); // Release status
      });
    });
  });

  describe('Empty States', () => {
    it('should show success message when no errors found', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ issues: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            stats: {
              crashFreeUsers: 100,
              errorRate: 0,
              activeIssues: 0,
              newIssues24h: 0,
              resolvedIssues24h: 0,
              p95ResponseTime: 200,
              affectedUsers: 0
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ release: null })
        });

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('No active error issues found!')).toBeInTheDocument();
        expect(screen.getByText('Your application is running smoothly')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch error data:', expect.any(Error));
      });

      (consoleSpy as jest.Mock).mockRestore();
    });
  });

  describe('Severity Indicators', () => {
    it('should display correct severity icons and badges', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            issues: [
              {
                id: '1',
                title: 'Error issue',
                culprit: 'test.js',
                level: 'error',
                count: 1,
                userCount: 1,
                firstSeen: new Date(),
                lastSeen: new Date(),
                status: 'unresolved',
                isRegression: false
              },
              {
                id: '2',
                title: 'Warning issue',
                culprit: 'test.js',
                level: 'warning',
                count: 1,
                userCount: 1,
                firstSeen: new Date(),
                lastSeen: new Date(),
                status: 'unresolved',
                isRegression: false
              },
              {
                id: '3',
                title: 'Info issue',
                culprit: 'test.js',
                level: 'info',
                count: 1,
                userCount: 1,
                firstSeen: new Date(),
                lastSeen: new Date(),
                status: 'unresolved',
                isRegression: false
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ stats: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ release: {} })
        });

      render(<ErrorMonitor />);

      await waitFor(() => {
        expect(screen.getByText('ERROR')).toBeInTheDocument();
        expect(screen.getByText('WARNING')).toBeInTheDocument();
        expect(screen.getByText('INFO')).toBeInTheDocument();
      });
    });
  });
});
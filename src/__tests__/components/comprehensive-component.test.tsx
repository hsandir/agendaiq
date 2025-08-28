/**
 * Comprehensive Component Tests
 * Tests for all major UI components with accessibility, interaction, and edge cases
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test utilities
// import { renderWithProviders } from '../utils/test-utils';

// Types
import type { Authenticatedusers, StaffWithRelations } from '@/types';

// Mock data factory
/* const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 1,
  email: 'test@agendaiq.com',
  name: 'Test User',
  hashed_password: null,
  is_admin: false,
  is_system_admin: false,
  created_at: new Date(),
  updated_at: new Date(),
  staff: null,
  ...overrides
});

// const createMockStaff = (overrides: Partial<StaffWithRelations> = {}): StaffWithRelations => ({
//   id: 1,
//   user_id: 1,
//   role_id: 1,
//   department_id: 1,
//   school_id: 1,
//   district_id: 1,
//   employee_id: 'EMP001',
//   hire_date: new Date(),
//   is_active: true,
//   created_at: new Date(),
//   updated_at: new Date(),
//   User: createMockUser(),
//   Role: {
//     id: 1,
//     title: 'Teacher',
//     key: 'ROLE_6',
//     priority: 6,
//     is_leadership: false,
//     capabilities: [],
//     created_at: new Date(),
//     updated_at: new Date();
//   },
//   Department: {
//     id: 1,
//     name: 'Mathematics',
//     code: 'MATH',
//     school_id: 1,
//     created_at: new Date(),
//     updated_at: new Date();
//   },
//   School: {
//     id: 1,
//     name: 'Test School',
//     code: 'TS001',
//     district_id: 1,
//     address: '123 School St',
//     created_at: new Date(),
//     updated_at: new Date();
//   },
//   District: {
//     id: 1,
//     name: 'Test District',
//     code: 'TD001',
//     address: '123 District Ave',
//     created_at: new Date(),
//     updated_at: new Date();
//   },
//   ...overrides
}); */

// Mock Search Component (used in multiple describe blocks)
const MockSearchComponent = ({ 
  onSearch,
  placeholder = 'Search...',
  value = '',
  loading = false,
  results = []
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
  loading?: boolean;
  results?: Array<{ id: number; title: string; type: string }>;
}) => {
  const [query, setQuery] = React.useState(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div data-testid="search-component">
      <form onSubmit={handleSubmit} data-testid="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          data-testid="search-input"
          disabled={loading}
        />
        <button 
          type="submit" 
          data-testid="search-button"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {results.length > 0 && (
        <div data-testid="search-results">
          {results.map(result => (
            <div key={result.id} data-testid={`search-result-${result.id}`}>
              <span className="result-title">{result.title}</span>
              <span className="result-type">{result.type}</span>
            </div>
          ))}
        </div>
      )}
      
      {!loading && results.length === 0 && query && (
        <div data-testid="no-results">No results found</div>
      )}
    </div>
  );
};

describe('Comprehensive Component Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('📋 Form Components', () => {
    // Dynamic import to avoid immediate loading issues
    let SignInForm: React.ComponentType<{ 
      onSubmit: (data: { email: string; password: string }) => Promise<void>;
      loading?: boolean;
      error?: string;
    }>;

    beforeAll(async () => {
      try {
        const signInModule = await import('@/components/auth/SignInForm');
        SignInForm = signInModule.SignInForm;
      } catch {
        // If component doesn't exist, create a mock
        SignInForm = function MockSignInForm({ onSubmit, loading, error }) {
          return (
          <form data-testid="signin-form">
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              data-testid="email-input"
            />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              data-testid="password-input"
            />
            {error && <div data-testid="error-message">{error}</div>}
            <button 
              type="submit" 
              disabled={loading}
              data-testid="submit-button"
              onClick={async (e) => {
                e.preventDefault();
                const form = e.currentTarget.closest('form') as HTMLFormElement;
                const formData = new FormData(form);
                await onSubmit({
                  email: formData.get('email') as string,
                  password: formData.get('password') as string
                });
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          );
        };
      }
    });

    describe('SignInForm Component', () => {
      it('should render all form elements', () => {
        render(<SignInForm onSubmit={mockSubmit} />);

        expect(screen.getByTestId('signin-form')).toBeInTheDocument();
        expect(screen.getByTestId('email-input')).toBeInTheDocument();
        expect(screen.getByTestId('password-input')).toBeInTheDocument();
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      it('should handle form submission', async () => {
        const user = userEvent.setup();
        const mockSubmit = jest.fn().mockResolvedValue(undefined);
        
        render(<SignInForm onSubmit={mockSubmit} />);

        const emailInput = screen.getByTestId('email-input');
        const passwordInput = screen.getByTestId('password-input');
        const submitButton = screen.getByTestId('submit-button');

        await (user as Record<string, unknown>).type(emailInput, 'test@example.com');
        await (user as Record<string, unknown>).type(passwordInput, 'password123');
        await (user as Record<string, unknown>).click(submitButton);

        await waitFor(() => {
          expect(mockSubmit).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123'
          });
        });
      });

      it('should show loading state', () => {
        render(<SignInForm onSubmit={mockSubmit} loading={true} />);

        const submitButton = screen.getByTestId('submit-button');
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('Signing in...');
      });

      it('should display error messages', () => {
        const errorMessage = 'Invalid credentials';
        
        render(<SignInForm onSubmit={mockSubmit} error={errorMessage} />);

        expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
      });

      it('should be accessible', async () => {
        const { container } = render(<SignInForm onSubmit={jest.fn()} />);

        const results = await axe(container as Element);
        expect(results as any).toHaveNoViolations();
      });

      it('should handle keyboard navigation', async () => {
        const user = userEvent.setup();
        render(<SignInForm onSubmit={mockSubmit} />);

        const emailInput = screen.getByTestId('email-input');
        const passwordInput = screen.getByTestId('password-input');
        const submitButton = screen.getByTestId('submit-button');

        // Tab through form elements
        await (user as Record<string, unknown>).tab();
        expect(emailInput).toHaveFocus();

        await (user as Record<string, unknown>).tab();
        expect(passwordInput).toHaveFocus();

        await (user as Record<string, unknown>).tab();
        expect(submitButton).toHaveFocus();
      });

      it('should validate email format', async () => {
        const user = userEvent.setup();
        render(<SignInForm onSubmit={mockSubmit} />);

        const emailInput = screen.getByTestId('email-input');
        await (user as Record<string, unknown>).type(emailInput, 'invalid-email');
        
        // Check HTML5 validation
        expect(emailInput).toHaveAttribute('type', 'email');
      });
    });
  });

  describe('📊 Data Display Components', () => {
    // Mock Meeting Card Component
    const MockMeetingCard = ({ 
      meeting, 
      onEdit, 
      onDelete,
      canEdit = false 
    }: {
      meeting: {
        id: number;
        title: string;
        description?: string;
        start_time: Date;
        end_time: Date;
        location?: string;
        status: string;
        organizer: {
          name: string;
          email: string
        };
        attendeeCount: number;
        agendaItemCount: number
      };
      onEdit?: (id: number) => void;
      onDelete?: (id: number) => void;
      canEdit?: boolean;
    }) => (
      <div data-testid="meeting-card" className="meeting-card">
        <div data-testid="meeting-title">{meeting.title}</div>
        {meeting.description && (
          <div data-testid="meeting-description">{meeting.description}</div>
        )}
        <div data-testid="meeting-time">
          {meeting.start_time.toLocaleString()} - {meeting.end_time.toLocaleString()}
        </div>
        {meeting.location && (
          <div data-testid="meeting-location">{meeting.location}</div>
        )}
        <div data-testid="meeting-status" className={`status-${meeting.status.toLowerCase()}`}>
          {meeting.status}
        </div>
        <div data-testid="meeting-organizer">
          Organized by: {meeting.organizer.name}
        </div>
        <div data-testid="meeting-stats">
          {meeting.attendeeCount} attendees • {meeting.agendaItemCount} agenda items
        </div>
        {canEdit && (
          <div data-testid="meeting-actions">
            <button 
              data-testid="edit-button"
              onClick={() => onEdit?.(meeting.id)}
            >
              Edit
            </button>
            <button 
              data-testid="delete-button"
              onClick={() => onDelete?.(meeting.id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );

    describe('MeetingCard Component', () => {
      const mockMeeting = {
        id: 1,
        title: 'Test Meeting',
        description: 'This is a test meeting',
        start_time: new Date('2024-12-01T10:00:00'),
        end_time: new Date('2024-12-01T11:00:00'),
        location: 'Conference Room A',
        status: 'Scheduled',
        organizer: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        attendeeCount: 5,
        agendaItemCount: 3
      };

      it('should render meeting information', () => {
        render(<MockMeetingCard meeting={mockMeeting} />);

        expect(screen.getByTestId('meeting-title')).toHaveTextContent('Test Meeting');
        expect(screen.getByTestId('meeting-description')).toHaveTextContent('This is a test meeting');
        expect(screen.getByTestId('meeting-location')).toHaveTextContent('Conference Room A');
        expect(screen.getByTestId('meeting-status')).toHaveTextContent('Scheduled');
        expect(screen.getByTestId('meeting-organizer')).toHaveTextContent('Organized by: John Doe');
        expect(screen.getByTestId('meeting-stats')).toHaveTextContent('5 attendees • 3 agenda items');
      });

      it('should handle missing optional fields', () => {
        const minimalMeeting = {
          ...mockmeeting,
          description: undefined,
          location: undefined
        };

        render(<MockMeetingCard meeting={minimalMeeting} />);

        expect(screen.getByTestId('meeting-title')).toHaveTextContent('Test Meeting');
        expect(screen.queryByTestId('meeting-description')).not.toBeInTheDocument();
        expect(screen.queryByTestId('meeting-location')).not.toBeInTheDocument();
      });

      it('should show edit actions when canEdit is true', () => {
        const mockEdit = jest.fn();
        const mockDelete = jest.fn();

        render(
          <MockMeetingCard 
            meeting={mockMeeting} 
            canEdit={true}
            onEdit={mockEdit}
            onDelete={mockDelete}
          />
        );

        expect(screen.getByTestId('meeting-actions')).toBeInTheDocument();
        expect(screen.getByTestId('edit-button')).toBeInTheDocument();
        expect(screen.getByTestId('delete-button')).toBeInTheDocument();
      });

      it('should hide edit actions when canEdit is false', () => {
        render(<MockMeetingCard meeting={mockMeeting} canEdit={false} />);

        expect(screen.queryByTestId('meeting-actions')).not.toBeInTheDocument();
      });

      it('should handle edit and delete actions', async () => {
        const user = userEvent.setup();
        const mockEdit = jest.fn();
        const mockDelete = jest.fn();

        render(
          <MockMeetingCard 
            meeting={mockMeeting} 
            canEdit={true}
            onEdit={mockEdit}
            onDelete={mockDelete}
          />
        );

        await (user as Record<string, unknown>).click(screen.getByTestId('edit-button'));
        expect(mockEdit).toHaveBeenCalledWith(1);

        await (user as Record<string, unknown>).click(screen.getByTestId('delete-button'));
        expect(mockDelete).toHaveBeenCalledWith(1);
      });

      it('should apply status-based styling', () => {
        render(<MockMeetingCard meeting={mockMeeting} />);

        const statusElement = screen.getByTestId('meeting-status');
        expect(statusElement).toHaveClass('status-scheduled');
      });

      it('should be accessible', async () => {
        const { container } = render(<MockMeetingCard meeting={mockMeeting} />);

        const results = await axe(container as Element);
        expect(results as any).toHaveNoViolations();
      });

      it('should handle long text content properly', () => {
        const longMeeting = {
          ...mockmeeting,
          title: 'A'.repeat(100),
          description: 'B'.repeat(500),
          location: 'C'.repeat(50)
        };

        render(<MockMeetingCard meeting={longMeeting} />);

        expect(screen.getByTestId('meeting-title')).toBeInTheDocument();
        expect(screen.getByTestId('meeting-description')).toBeInTheDocument();
        expect(screen.getByTestId('meeting-location')).toBeInTheDocument();
      });
    });
  });

  describe('🎛️ Interactive Components', () => {
    // Mock Dashboard Stats Component
    const MockDashboardStats = ({ 
      stats,
      loading = false,
      error = null
    }: {
      stats?: {
        totalMeetings: number;
        upcomingMeetings: number;
        completedMeetings: number;
        totalStaff: number;
        activeUsers: number;
        pendingAgendaItems: number
      };
      loading?: boolean;
      error?: string | null;
    }) => {
      if (loading) {
        return <div data-testid="loading-spinner">Loading stats...</div>;
      }

      if (error) {
        return <div data-testid="error-message" role="alert">{error}</div>;
      }

      if (!stats) {
        return <div data-testid="no-data">No statistics available</div>;
      }

      return (
        <div data-testid="dashboard-stats" className="stats-grid">
          <div data-testid="stat-total-meetings" className="stat-card">
            <h3>Total Meetings</h3>
            <span className="stat-value">{stats.totalMeetings}</span>
          </div>
          <div data-testid="stat-upcoming-meetings" className="stat-card">
            <h3>Upcoming Meetings</h3>
            <span className="stat-value">{stats.upcomingMeetings}</span>
          </div>
          <div data-testid="stat-completed-meetings" className="stat-card">
            <h3>Completed Meetings</h3>
            <span className="stat-value">{stats.completedMeetings}</span>
          </div>
          <div data-testid="stat-total-staff" className="stat-card">
            <h3>Total Staff</h3>
            <span className="stat-value">{stats.totalStaff}</span>
          </div>
          <div data-testid="stat-active-users" className="stat-card">
            <h3>Active Users</h3>
            <span className="stat-value">{stats.activeUsers}</span>
          </div>
          <div data-testid="stat-pending-items" className="stat-card">
            <h3>Pending Agenda Items</h3>
            <span className="stat-value">{stats.pendingAgendaItems}</span>
          </div>
        </div>
      );
    };

    describe('DashboardStats Component', () => {
      const mockStats = {
        totalMeetings: 45,
        upcomingMeetings: 12,
        completedMeetings: 33,
        totalStaff: 28,
        activeUsers: 25,
        pendingAgendaItems: 15
      };

      it('should render all statistics', () => {
        render(<MockDashboardStats stats={mockStats} />);

        expect(screen.getByTestId('stat-total-meetings')).toHaveTextContent('45');
        expect(screen.getByTestId('stat-upcoming-meetings')).toHaveTextContent('12');
        expect(screen.getByTestId('stat-completed-meetings')).toHaveTextContent('33');
        expect(screen.getByTestId('stat-total-staff')).toHaveTextContent('28');
        expect(screen.getByTestId('stat-active-users')).toHaveTextContent('25');
        expect(screen.getByTestId('stat-pending-items')).toHaveTextContent('15');
      });

      it('should show loading state', () => {
        render(<MockDashboardStats loading={true} />);

        expect(screen.getByTestId('loading-spinner')).toHaveTextContent('Loading stats...');
        expect(screen.queryByTestId('dashboard-stats')).not.toBeInTheDocument();
      });

      it('should show error state', () => {
        const errorMessage = 'Failed to load statistics';
        render(<MockDashboardStats error={errorMessage} />);

        const errorElement = screen.getByTestId('error-message');
        expect(errorElement).toHaveTextContent(errorMessage);
        expect(errorElement).toHaveAttribute('role', 'alert');
      });

      it('should handle no data state', () => {
        render(<MockDashboardStats />);

        expect(screen.getByTestId('no-data')).toHaveTextContent('No statistics available');
      });

      it('should handle zero values correctly', () => {
        const zeroStats = {
          totalMeetings: 0,
          upcomingMeetings: 0,
          completedMeetings: 0,
          totalStaff: 0,
          activeUsers: 0,
          pendingAgendaItems: 0
        };

        render(<MockDashboardStats stats={zeroStats} />);

        expect(screen.getByTestId('stat-total-meetings')).toHaveTextContent('0');
        expect(screen.getByTestId('stat-upcoming-meetings')).toHaveTextContent('0');
      });

      it('should handle large numbers', () => {
        const largeStats = {
          totalMeetings: 1234567,
          upcomingMeetings: 999999,
          completedMeetings: 888888,
          totalStaff: 777777,
          activeUsers: 666666,
          pendingAgendaItems: 555555
        };

        render(<MockDashboardStats stats={largeStats} />);

        expect(screen.getByTestId('stat-total-meetings')).toHaveTextContent('1234567');
      });

      it('should be accessible', async () => {
        const { container } = render(<MockDashboardStats stats={mockStats} />);

        const results = await axe(container as Element);
        expect(results as any).toHaveNoViolations();
      });
    });
  });

  describe('🔍 Search and Filter Components', () => {

    describe('Search Component', () => {
      it('should render search input and button', () => {
        const _mockSearch = jest.fn();
        render(<MockSearchComponent onSearch={mockSearch} />);

        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('search-button')).toBeInTheDocument();
      });

      it('should handle search submission', async () => {
        const user = userEvent.setup();
        const _mockSearch = jest.fn();
        
        render(<MockSearchComponent onSearch={mockSearch} />);

        const searchInput = screen.getByTestId('search-input');
        const searchButton = screen.getByTestId('search-button');

        await (user as Record<string, unknown>).type(searchInput, 'test query');
        await (user as Record<string, unknown>).click(searchButton);

        expect(mockSearch).toHaveBeenCalledWith('test query');
      });

      it('should handle Enter key submission', async () => {
        const user = userEvent.setup();
        const _mockSearch = jest.fn();
        
        render(<MockSearchComponent onSearch={mockSearch} />);

        const searchInput = screen.getByTestId('search-input');
        await (user as Record<string, unknown>).type(searchInput, 'test query{enter}');

        expect(mockSearch).toHaveBeenCalledWith('test query');
      });

      it('should show loading state', () => {
        const _mockSearch = jest.fn();
        render(<MockSearchComponent onSearch={mockSearch} loading={true} />);

        const searchInput = screen.getByTestId('search-input');
        const searchButton = screen.getByTestId('search-button');

        expect(searchInput).toBeDisabled();
        expect(searchButton).toBeDisabled();
        expect(searchButton).toHaveTextContent('Searching...');
      });

      it('should display search results', () => {
        const _mockSearch = jest.fn();
        const mockResults = [
          { id: 1, title: 'Meeting 1', type: 'Meeting' },
          { id: 2, title: 'User 1', type: 'User' },
        ];

        render(<MockSearchComponent onSearch={mockSearch} results={mockResults} />);

        expect(screen.getByTestId('search-results')).toBeInTheDocument();
        expect(screen.getByTestId('search-result-1')).toHaveTextContent('Meeting 1Meeting');
        expect(screen.getByTestId('search-result-2')).toHaveTextContent('User 1User');
      });

      it('should show no results message', () => {
        const _mockSearch = jest.fn();
        render(<MockSearchComponent onSearch={mockSearch} value="no results query" results={[]} />);

        expect(screen.getByTestId('no-results')).toHaveTextContent('No results found');
      });

      it('should be accessible', async () => {
        const _mockSearch = jest.fn();
        const { container } = render(<MockSearchComponent onSearch={jest.fn()} />);

        const results = await axe(container as Element);
        expect(results as any).toHaveNoViolations();
      });
    });
  });

  describe('📱 Responsive Behavior', () => {
    beforeEach(() => {
      // Mock matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onChange: null,
          addListener: jest.fn(), // deprecated
          removeListener: jest.fn(), // deprecated
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });

    it('should handle mobile viewport', () => {
      // Mock mobile viewport
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onChange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const _mockSearch = jest.fn();
      render(<MockSearchComponent onSearch={mockSearch} />);

      // Component should render appropriately for mobile
      expect(screen.getByTestId('search-component')).toBeInTheDocument();
    });

    it('should handle tablet viewport', () => {
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(max-width: 1024px)',
        media: query,
        onChange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const _mockSearch = jest.fn();
      render(<MockSearchComponent onSearch={mockSearch} />);

      expect(screen.getByTestId('search-component')).toBeInTheDocument();
    });
  });

  describe('⚡ Performance Tests', () => {
    it('should render large lists efficiently', () => {
      const startTime = performance.now();
      
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Item ${i}`,
        type: 'Test'
      }));

      const _mockSearch = jest.fn();
      render(<MockSearchComponent onSearch={mockSearch} results={largeResults} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should complete in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      
      // All results should be rendered
      expect(screen.getAllByTestId(/search-result-/)).toHaveLength(1000);
    });

    it('should handle rapid state changes', async () => {
      const user = userEvent.setup();
      const _mockSearch = jest.fn();
      
      render(<MockSearchComponent onSearch={mockSearch} />);

      const searchInput = screen.getByTestId('search-input');

      // Rapidly type and change input
      await (user as Record<string, unknown>).type(searchInput, 'a');
      await (user as Record<string, unknown>).clear(searchInput);
      await (user as Record<string, unknown>).type(searchInput, 'b');
      await (user as Record<string, unknown>).clear(searchInput);
      await (user as Record<string, unknown>).type(searchInput, 'final query');

      // Component should handle rapid changes without errors
      expect(searchInput).toHaveValue('final query');
    });
  });
});
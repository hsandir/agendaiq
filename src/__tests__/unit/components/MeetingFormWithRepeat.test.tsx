import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MeetingFormStep1 } from '@/components/meetings/MeetingFormStep1';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <input onChange={onChange} value={value} {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ onChange, value, ...props }: any) => (
    <textarea onChange={onChange} value={value} {...props} />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectValue: () => <span>Select value</span>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div className="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@/components/ui/date-time-picker', () => ({
  DateTimePicker: ({ label, onChange, value }: any) => (
    <div>
      <label>{label}</label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

jest.mock('@/components/ui/multi-select-v2', () => ({
  MultiSelectV2: ({ label, onChange, selected }: any) => (
    <div>
      <label>{label}</label>
      <div>Selected: {selected.length}</div>
      <button onClick={() => onChange(['1', '2'])}>Select Users</button>
    </div>
  ),
}));

jest.mock('@/components/meetings/RepeatMeetingModal', () => ({
  RepeatMeetingModal: ({ isOpen, onConfirm }: any) => 
    isOpen ? (
      <div data-testid="repeat-modal">
        <button onClick={() => onConfirm({
          enabled: true,
          pattern: 'weekly',
          endType: 'after',
          occurrences: 10,
          includeAgenda: true,
        })}>
          Confirm Repeat
        </button>
      </div>
    ) : null,
}));

describe('MeetingFormStep1 with Repeat', () => {
  const mockUsers = [
    { id: '1', name: 'User 1', email: 'user1@test.com', department: 'IT', role: 'Developer' },
    { id: '2', name: 'User 2', email: 'user2@test.com', department: 'HR', role: 'Manager' },
  ];

  const mockDepartments = [
    { id: 1, name: 'IT', code: 'IT' },
    { id: 2, name: 'HR', code: 'HR' },
  ];

  const mockRoles = [
    { id: 1, title: 'Developer' },
    { id: 2, title: 'Manager' },
  ];

  const defaultProps = {
    users: mockUsers,
    departments: mockDepartments,
    roles: mockRoles,
    onSubmit: jest.fn(() => Promise.resolve({ success: true, meetingId: 1 })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meeting form with all sections', () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    expect(screen.getByText('Basic Meeting Information')).toBeInTheDocument();
    expect(screen.getByText('Meeting Settings')).toBeInTheDocument();
    expect(screen.getByText('Continuation Meeting')).toBeInTheDocument();
    expect(screen.getByText('Select Attendees')).toBeInTheDocument();
  });

  it('shows repeat configuration button', () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    expect(screen.getByText('Configure Repeat Settings')).toBeInTheDocument();
  });

  it('opens repeat modal when button clicked', () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    const repeatButton = screen.getByText('Configure Repeat Settings');
    fireEvent.click(repeatButton);
    
    expect(screen.getByTestId('repeat-modal')).toBeInTheDocument();
  });

  it('updates button text after repeat configuration', async () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    // Open modal
    const repeatButton = screen.getByText('Configure Repeat Settings');
    fireEvent.click(repeatButton);
    
    // Confirm repeat settings
    const confirmButton = screen.getByText('Confirm Repeat');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Repeats weekly/)).toBeInTheDocument();
    });
  });

  it('validates required fields before submission', async () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    const submitButton = screen.getByText('Continue to Step 2');
    fireEvent.click(submitButton);
    
    // Should show alert for missing fields
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalled();
    });
  });

  it('submits form with repeat configuration', async () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    // Fill required fields
    const titleInput = screen.getByPlaceholderText('Enter meeting title');
    fireEvent.change(titleInput, { target: { value: 'Test Meeting' } });
    
    // Select attendees
    const selectUsersButton = screen.getByText('Select Users');
    fireEvent.click(selectUsersButton);
    
    // Configure repeat
    const repeatButton = screen.getByText('Configure Repeat Settings');
    fireEvent.click(repeatButton);
    
    const confirmRepeatButton = screen.getByText('Confirm Repeat');
    fireEvent.click(confirmRepeatButton);
    
    // Submit form
    const submitButton = screen.getByText('Continue to Step 2');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Meeting',
          repeatConfig: expect.objectContaining({
            enabled: true,
            pattern: 'weekly',
            occurrences: 10,
          }),
        })
      );
    });
  });

  it('clears repeat configuration when button clicked', async () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    // Configure repeat
    const repeatButton = screen.getByText('Configure Repeat Settings');
    fireEvent.click(repeatButton);
    
    const confirmButton = screen.getByText('Confirm Repeat');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Repeats weekly/)).toBeInTheDocument();
    });
    
    // Clear repeat
    const clearButton = screen.getByText('Clear repeat settings');
    fireEvent.click(clearButton);
    
    expect(screen.getByText('Configure Repeat Settings')).toBeInTheDocument();
  });

  it('handles meeting type selection', () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    expect(screen.getByText('Regular Meeting')).toBeInTheDocument();
    expect(screen.getByText('Emergency Meeting')).toBeInTheDocument();
    expect(screen.getByText('Review Meeting')).toBeInTheDocument();
  });

  it('handles continuation meeting toggle', () => {
    render(<MeetingFormStep1 {...defaultProps} />);
    
    const continuationLabel = screen.getByText('This is a continuation of a previous meeting');
    expect(continuationLabel).toBeInTheDocument();
  });
});
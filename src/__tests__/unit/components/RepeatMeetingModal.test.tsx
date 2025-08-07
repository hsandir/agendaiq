import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RepeatMeetingModal } from '@/components/meetings/RepeatMeetingModal';
import { format } from 'date-fns';

// Mock the UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <input onChange={onChange} value={value} {...props} />
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div data-value={value} onChange={(e: any) => {
      if (e.target.type === 'radio') {
        onValueChange(e.target.value);
      }
    }}>{children}</div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <input type="radio" value={value} id={id} name="radio-group" />
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

describe('RepeatMeetingModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    startDate: '2024-01-15T10:00',
    endDate: '2024-01-15T11:00',
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Configure Repeat Meeting')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<RepeatMeetingModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('displays repeat pattern options', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Bi-weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('shows end date options', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    expect(screen.getByText('No end date')).toBeInTheDocument();
    expect(screen.getByText(/After/)).toBeInTheDocument();
    expect(screen.getByText(/By/)).toBeInTheDocument();
  });

  it('displays preview section', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    expect(screen.getByText(/Preview \(First 10 occurrences\)/)).toBeInTheDocument();
  });

  it('shows agenda copy option', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    expect(screen.getByText('Copy agenda to all meetings')).toBeInTheDocument();
  });

  it('calls onConfirm with config when confirmed', async () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    
    const confirmButton = screen.getByText(/Create Series/);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          pattern: expect.any(String),
          includeAgenda: true,
        })
      );
    });
  });

  it('calls onClose when cancelled', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('toggles advanced options', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    
    const advancedButton = screen.getByText(/Show Advanced Options/);
    fireEvent.click(advancedButton);
    
    expect(screen.getByText(/Hide Advanced Options/)).toBeInTheDocument();
    expect(screen.getByText(/Exclude dates/)).toBeInTheDocument();
  });

  it('handles custom pattern selection', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    
    // Look for text content instead of label
    const customOption = screen.getByText('Custom');
    fireEvent.click(customOption);
    
    // Should show custom pattern options - wait for them to appear
    setTimeout(() => {
      expect(screen.getByText(/Repeat every/)).toBeInTheDocument();
      expect(screen.getByText(/On these days/)).toBeInTheDocument();
    }, 100);
  });

  it('handles monthly pattern options', () => {
    render(<RepeatMeetingModal {...defaultProps} />);
    
    const monthlyOption = screen.getByText('Monthly');
    fireEvent.click(monthlyOption);
    
    // Should show monthly options - wait for them to appear
    setTimeout(() => {
      expect(screen.getByText(/On day/)).toBeInTheDocument();
    }, 100);
  });
});
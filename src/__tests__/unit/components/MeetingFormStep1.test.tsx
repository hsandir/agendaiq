import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MeetingFormStep1 } from '/Users/hs/Project/agendaiq/src/components/meetings/MeetingFormStep1'
import { renderWithProviders } from '@/__tests__/utils/test-utils'

describe('MeetingFormStep1', () => {
  const defaultProps = {
    users: 'test-value',
    departments: 'test-value',
    roles: 'test-value',
    onSubmit: 'test-value',
    description: 'test-value',
    startTime: 'test-value',
    endTime: 'test-value',
    repeatType: 'test-value',
    repeatEndDate: 'test-value',
    calendarIntegration: 'test-value',
    meetingType: 'test-value',
    zoomMeetingId: 'test-value',
    attendeeIds: 'test-value',
    isContinuation: 'test-value',
    parentMeetingId: 'test-value'
  }

  it('renders without crashing', () => {
    renderWithProviders(<MeetingFormStep1 {...defaultProps} />)
    
    // Add specific assertions based on component content
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  

  

  it('updates state correctly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MeetingFormStep1 {...defaultProps} />)
    
    // Add state change interaction test
    const input = screen.getByRole('textbox')
    await user.type(input, 'New Value')
    
    expect(input).toHaveValue('New Value')
  })

  

  it('handles loading state', () => {
    renderWithProviders(<MeetingFormStep1 {...defaultProps} />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles error state', async () => {
    // Mock error scenario
    renderWithProviders(<MeetingFormStep1 {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <MeetingFormStep1 {...defaultProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible', () => {
    const { container } = renderWithProviders(<MeetingFormStep1 {...defaultProps} />)
    
    // Basic accessibility checks
    expect(container.firstChild).toHaveAttribute('role')
  })
})
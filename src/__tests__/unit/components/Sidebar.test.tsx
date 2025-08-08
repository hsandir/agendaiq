import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '/Users/hs/Project/agendaiq/src/components/dashboard/Sidebar'
import { renderWithProviders } from '@/__tests__/utils/test-utils'

describe('Sidebar', () => {
  const defaultProps = {
    onSettingsClick: 'test-value'
  }

  it('renders without crashing', () => {
    renderWithProviders(<Sidebar {...defaultProps} />)
    
    // Add specific assertions based on component content
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  

  

  

  

  

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <Sidebar {...defaultProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible', () => {
    const { container } = renderWithProviders(<Sidebar {...defaultProps} />)
    
    // Basic accessibility checks
    expect(container.firstChild).toHaveAttribute('role')
  })
})
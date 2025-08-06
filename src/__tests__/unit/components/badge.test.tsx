import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Badge } from '/Users/hs/Project/agendaiq/src/components/ui/badge'
import { renderWithProviders } from '@/__tests__/utils/test-utils'

describe('Badge', () => {
  

  it('renders without crashing', () => {
    renderWithProviders(<Badge />)
    
    // Add specific assertions based on component content
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  

  

  

  

  

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <Badge className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible', () => {
    const { container } = renderWithProviders(<Badge  />)
    
    // Basic accessibility checks
    expect(container.firstChild).toHaveAttribute('role')
  })
})
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Avatar } from '/Users/hs/Project/agendaiq/src/components/ui/avatar'
import { renderWithProviders } from '@/__tests__/utils/test-utils'

describe('Avatar', () => {
  

  it('renders without crashing', () => {
    renderWithProviders(<Avatar />)
    
    // Add specific assertions based on component content
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  

  

  

  

  

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <Avatar className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible', () => {
    const { container } = renderWithProviders(<Avatar  />)
    
    // Basic accessibility checks
    expect(container.firstChild).toHaveAttribute('role')
  })
})
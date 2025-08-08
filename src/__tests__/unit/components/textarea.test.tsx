import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '/Users/hs/Project/agendaiq/src/components/ui/textarea'
import { renderWithProviders } from '@/__tests__/utils/test-utils'

describe('Textarea', () => {
  

  it('renders without crashing', () => {
    renderWithProviders(<Textarea />)
    
    // Add specific assertions based on component content
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  

  

  

  

  

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <Textarea className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible', () => {
    const { container } = renderWithProviders(<Textarea  />)
    
    // Basic accessibility checks
    expect(container.firstChild).toHaveAttribute('role')
  })
})
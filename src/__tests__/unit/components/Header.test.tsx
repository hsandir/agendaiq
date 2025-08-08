import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '/Users/hs/Project/agendaiq/src/components/dashboard/Header'
import { renderWithProviders } from '@/__tests__/utils/test-utils'

describe('Header', () => {
  

  it('renders without crashing', () => {
    renderWithProviders(<Header />)
    
    // Add specific assertions based on component content
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  

  

  

  

  

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <Header className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible', () => {
    const { container } = renderWithProviders(<Header  />)
    
    // Basic accessibility checks
    expect(container.firstChild).toHaveAttribute('role')
  })
})
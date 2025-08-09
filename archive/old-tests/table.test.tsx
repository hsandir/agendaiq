import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table } from '/Users/hs/Project/agendaiq/src/components/ui/table'
import { renderWithProviders } from '@/__tests__/utils/test-utils'

describe('Table', () => {
  

  it('renders without crashing', () => {
    renderWithProviders(<Table />)
    
    // Add specific assertions based on component content
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  

  

  

  

  

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <Table className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible', () => {
    const { container } = renderWithProviders(<Table  />)
    
    // Basic accessibility checks
    expect(container.firstChild).toHaveAttribute('role')
  })
})
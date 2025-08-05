import { render, screen } from '@testing-library/react'
import { DashboardCard } from '@/components/dashboard/dashboard-card'

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Test Card',
    value: '42',
    icon: 'Users',
    description: 'Test description',
  }

  it('renders card with all props', () => {
    render(<DashboardCard {...defaultProps} />)
    
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('renders without description', () => {
    const { description, ...propsWithoutDescription } = defaultProps
    render(<DashboardCard {...propsWithoutDescription} />)
    
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.queryByText('Test description')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <DashboardCard {...defaultProps} className="custom-class" />
    )
    
    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })

  it('renders loading state', () => {
    render(<DashboardCard {...defaultProps} isLoading />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<DashboardCard {...defaultProps} onClick={handleClick} />)
    
    const card = screen.getByRole('button')
    card.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('displays trend indicator', () => {
    render(
      <DashboardCard 
        {...defaultProps} 
        trend={{ value: 12, direction: 'up' }}
      />
    )
    
    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByTestId('trend-up-icon')).toBeInTheDocument()
  })

  it('displays negative trend', () => {
    render(
      <DashboardCard 
        {...defaultProps} 
        trend={{ value: -5, direction: 'down' }}
      />
    )
    
    expect(screen.getByText('-5%')).toBeInTheDocument()
    expect(screen.getByTestId('trend-down-icon')).toBeInTheDocument()
  })

  it('formats large numbers', () => {
    render(<DashboardCard {...defaultProps} value="1234567" />)
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })

  it('renders with different icon sizes', () => {
    const { rerender } = render(
      <DashboardCard {...defaultProps} iconSize="small" />
    )
    
    let icon = screen.getByTestId('card-icon')
    expect(icon).toHaveClass('h-4 w-4')
    
    rerender(<DashboardCard {...defaultProps} iconSize="large" />)
    
    icon = screen.getByTestId('card-icon')
    expect(icon).toHaveClass('h-8 w-8')
  })

  it('applies correct color scheme', () => {
    const { rerender } = render(
      <DashboardCard {...defaultProps} variant="primary" />
    )
    
    let card = screen.getByTestId('dashboard-card')
    expect(card).toHaveClass('border-blue-200')
    
    rerender(<DashboardCard {...defaultProps} variant="success" />)
    
    card = screen.getByTestId('dashboard-card')
    expect(card).toHaveClass('border-green-200')
  })
})
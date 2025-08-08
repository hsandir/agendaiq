import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '@/components/auth/SignInForm'
import { signIn } from 'next-auth/react'

// Mock next-auth/react
jest.mock('next-auth/react')

describe('SignInForm', () => {
  const defaultProps = {
    isFirstTimeSetup: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders sign in form elements', () => {
    render(<SignInForm {...defaultProps} />)
    
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  

  

  it('handles form submission with valid credentials', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    mockSignIn.mockResolvedValueOnce({ ok: true, error: undefined, status: 200, url: '/dashboard' })
    
    render(<SignInForm {...defaultProps} />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'password123')
    await userEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
    })
  })

  it('displays error message on failed sign in', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    mockSignIn.mockResolvedValueOnce({ ok: false, error: 'Invalid credentials', status: 401, url: null })
    
    render(<SignInForm {...defaultProps} />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'wrongpassword')
    await userEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<SignInForm {...defaultProps} />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'password123')
    await userEvent.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('validates email format', async () => {
    render(<SignInForm {...defaultProps} />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await userEvent.type(emailInput, 'invalid-email')
    await userEvent.click(submitButton)
    
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
  })

  it('shows first time setup message when applicable', () => {
    render(<SignInForm isFirstTimeSetup={true} />)
    
    expect(screen.getByText(/welcome.*first time setup/i)).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<SignInForm {...defaultProps} />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('required')
  })
})
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import LoginForm from '@/components/auth/login-form'

type SignInResponse = {
  error?: string | null;
  ok?: boolean;
  status?: number;
  url?: string | null;
}

// Mock next-auth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: jest.fn(),
}))

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

describe('Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LoginForm', () => {
    it('renders login form with all fields', () => {
      render(<LoginForm />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument()
    })

    it('requires password', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)
      
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
    })

    it('submits login credentials successfully', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ error: null, ok: true } as SignInResponse)
      
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        })
      })
    })

    it('displays error message on failed login', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ 
        error: 'Invalid email or password', 
        ok: false 
      } as SignInResponse)
      
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
    })

    it('disables form during submission', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })

    it('redirects to 2FA page when required', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ 
        error: 'TwoFactorRequired',
        ok: false 
      } as SignInResponse)
      
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/two-factor?email=test%40example.com')
      })
    })
  })

  describe('Account Lockout', () => {
    it('shows account locked message after multiple failed attempts', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ 
        error: 'AccountLocked',
        ok: false 
      } as SignInResponse)
      
      render(<LoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      expect(await screen.findByText(/account has been locked/i)).toBeInTheDocument()
    })
  })

  describe('Remember Me', () => {
    it('includes remember me option in login', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ error: null, ok: true } as SignInResponse)
      
      render(<LoginForm />)
      
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
      expect(rememberMeCheckbox).toBeInTheDocument()
      
      await user.click(rememberMeCheckbox)
      expect(rememberMeCheckbox).toBeChecked()
    })
  })
})
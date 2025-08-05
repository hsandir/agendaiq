import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '@/components/auth/register-form'
import { mockFetchResponse, mockFetchError } from '@/__tests__/utils/test-utils'

// Mock routers
const mockPush = jest.fn()
const mockReplace = jest.fn()

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

describe('Registration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('RegisterForm', () => {
    it('renders registration form with all fields', () => {
      render(<RegisterForm />)
      
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument()
    })

    it('validates password requirements', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)
      
      // Fill required fields first
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await user.type(passwordInput, 'weak')
      await user.click(submitButton)
      
      expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })

    it('validates password confirmation match', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)
      
      // Fill required fields first
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      await user.type(passwordInput, 'StrongPass123!')
      await user.type(confirmPasswordInput, 'DifferentPass123!')
      await user.click(submitButton)
      
      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    })

    it('submits registration successfully', async () => {
      const user = userEvent.setup()
      mockFetchResponse({ success: true, message: 'Registration successful' })
      
      mockPush.mockClear()
      
      render(<RegisterForm />)
      
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123!')
      await user.click(screen.getByLabelText(/i agree to the terms/i))
      await user.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'StrongPass123!',
          }),
        })
      })
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/verify-email?email=john%40example.com')
      })
    })

    it('displays error for duplicate email', async () => {
      const user = userEvent.setup()
      mockFetchError('Email already exists', 400)
      
      render(<RegisterForm />)
      
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123!')
      await user.click(screen.getByLabelText(/i agree to the terms/i))
      await user.click(screen.getByRole('button', { name: /create account/i }))
      
      expect(await screen.findByText(/email already exists/i)).toBeInTheDocument()
    })

    it('shows password strength indicator', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      // Weak password
      await user.type(passwordInput, 'weak')
      expect(screen.getByText(/weak/i)).toBeInTheDocument()
      
      // Clear and type medium password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'medium123')
      expect(screen.getByText(/medium/i)).toBeInTheDocument()
      
      // Clear and type strong password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'StrongPass123!')
      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })

    it('disables form during submission', async () => {
      const user = userEvent.setup()
      
      // Create a promise that we can control
      let resolveFetch: any
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve
      })
      
      global.fetch = jest.fn().mockReturnValueOnce(fetchPromise as any)
      
      render(<RegisterForm />)
      
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123!')
      await user.click(screen.getByLabelText(/i agree to the terms/i))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      // Click and don't await to check intermediate state
      const clickPromise = user.click(submitButton)
      
      // Wait for React to update
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      })
      
      // Resolve the fetch
      resolveFetch({
        ok: true,
        json: async () => ({ success: true })
      })
      
      // Wait for the click to complete
      await clickPromise
    })
  })

  describe('Terms and Conditions', () => {
    it('requires accepting terms and conditions', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)
      
      // Fill all required fields first
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123!')
      await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123!')
      
      const termsCheckbox = screen.getByLabelText(/i agree to the terms/i)
      expect(termsCheckbox).toBeInTheDocument()
      expect(termsCheckbox).not.toBeChecked()
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      expect(await screen.findByText(/you must agree to the terms/i)).toBeInTheDocument()
    })
  })
})
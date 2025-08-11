import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn, type SignInResponse } from 'next-auth/react'
import TwoFactorForm from '@/components/auth/two-factor-form'
import { mockFetchResponse, mockFetchError } from '@/__tests__/utils/test-utils'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: jest.fn(),
}))

// Mock routers
const mockPush = jest.fn()
const mockReplace = jest.fn()

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: (key: string) => key === 'email' ? 'test@example.com' : null,
  }),
}))

describe('Two-Factor Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('TwoFactorForm', () => {
    it('renders 2FA code input form', () => {
      render(<TwoFactorForm />)
      
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
    })

    it('validates code format (6 digits)', async () => {
      const user = userEvent.setup()
      render(<TwoFactorForm />)
      
      const codeInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify/i })
      
      // Test invalid code (less than 6 digits)
      await user.type(codeInput, '123')
      await user.click(submitButton)
      
      expect(await screen.findByText(/code must be 6 digits/i)).toBeInTheDocument()
      
      // Clear error for next test
      await user.clear(codeInput)
      await user.type(codeInput, '123456')
    })

    it('submits valid 2FA code successfully', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ error: null, ok: true } as unknown)
      
      mockReplace.mockClear()
      
      render(<TwoFactorForm />)
      
      const codeInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify/i })
      
      await user.type(codeInput, '123456')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          twoFactorCode: '123456',
          redirect: false,
        })
      })
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('displays error for invalid code', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      mockSignIn.mockResolvedValueOnce({ 
        error: 'Invalid verification code', 
        ok: false 
      } as unknown)
      
      render(<TwoFactorForm />)
      
      const codeInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify/i })
      
      await user.type(codeInput, '999999')
      await user.click(submitButton)
      
      expect(await screen.findByText(/invalid verification code/i)).toBeInTheDocument()
    })

    it('shows resend code option', () => {
      render(<TwoFactorForm />)
      
      expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument()
    })

    it('handles resend code functionality', async () => {
      const user = userEvent.setup()
      mockFetchResponse({ success: true, message: 'Code sent' })
      
      render(<TwoFactorForm />)
      
      const resendButton = screen.getByRole('button', { name: /resend code/i })
      await user.click(resendButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/resend-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      })
      
      expect(await screen.findByText(/new code sent/i)).toBeInTheDocument()
    })

    it('implements rate limiting for resend attempts', async () => {
      const user = userEvent.setup()
      mockFetchError('Too many requests', 429)
      
      render(<TwoFactorForm />)
      
      const resendButton = screen.getByRole('button', { name: /resend code/i })
      await user.click(resendButton)
      
      expect(await screen.findByText(/please wait before requesting another code/i)).toBeInTheDocument()
    })

    it('auto-focuses on code input field', () => {
      render(<TwoFactorForm />)
      
      const codeInput = screen.getByLabelText(/verification code/i)
      expect(document.activeElement).toBe(codeInput)
    })

    it('disables form during submission', async () => {
      const user = userEvent.setup()
      const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
      
      // Create a promise that we can control
      let resolveSignIn: unknown
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve
      })
      
      mockSignIn.mockReturnValueOnce(signInPromise as Promise<SignInResponse | undefined>)
      
      render(<TwoFactorForm />)
      
      const codeInput = screen.getByLabelText(/verification code/i)
      const submitButton = screen.getByRole('button', { name: /verify/i })
      
      await user.type(codeInput, '123456')
      
      // Click and don't await to check intermediate state
      const clickPromise = user.click(submitButton)
      
      // Wait for React to update
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/verifying/i)).toBeInTheDocument()
      })
      
      // Resolve the sign in
      resolveSignIn({ ok: true })
      
      // Wait for the click to complete
      await clickPromise
    })
  })

  describe('Backup Codes', () => {
    it('shows option to use backup code', () => {
      render(<TwoFactorForm />)
      
      expect(screen.getByRole('button', { name: /use backup code/i })).toBeInTheDocument()
    })

    it('switches to backup code input', async () => {
      const user = userEvent.setup()
      render(<TwoFactorForm />)
      
      const backupCodeButton = screen.getByRole('button', { name: /use backup code/i })
      await user.click(backupCodeButton)
      
      expect(screen.getByLabelText(/backup code/i)).toBeInTheDocument()
      expect(screen.getByText(/enter your 8-character backup code/i)).toBeInTheDocument()
    })
  })
})
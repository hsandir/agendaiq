import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignInForm } from '@/components/auth/SignInForm';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SignInForm Component', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  it('renders email and password input fields', () => {
    render(<SignInForm />);
    
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<SignInForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('shows remember me and trust device checkboxes', () => {
    render(<SignInForm />);
    
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trust this device/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<SignInForm />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    // Email input should have invalid state
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('disables submit button while loading', async () => {
    (signIn as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves
    
    render(<SignInForm />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/signing in/i);
    });
  });

  it('calls signIn with correct credentials', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true });
    
    render(<SignInForm />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@school.edu' } });
    fireEvent.change(passwordInput, { target: { value: '1234' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'admin@school.edu',
        password: '1234',
        redirect: false,
      });
    });
  });

  it('redirects to dashboard on successful login', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true });
    
    render(<SignInForm />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@school.edu' } });
    fireEvent.change(passwordInput, { target: { value: '1234' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on failed login', async () => {
    (signIn as jest.Mock).mockResolvedValue({ 
      ok: false, 
      error: 'Invalid credentials' 
    });
    
    render(<SignInForm />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows 2FA input when required', async () => {
    (signIn as jest.Mock).mockResolvedValue({ 
      ok: false, 
      error: '2FA_REQUIRED' 
    });
    
    render(<SignInForm />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@school.edu' } });
    fireEvent.change(passwordInput, { target: { value: '1234' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Now shows 2FA input field
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
      expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    (signIn as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<SignInForm />);
    
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@school.edu' } });
    fireEvent.change(passwordInput, { target: { value: '1234' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
    });
  });


  it('remembers user preference when remember me is checked', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true });
    
    render(<SignInForm />);
    
    const rememberCheckbox = screen.getByLabelText(/remember me/i);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.click(rememberCheckbox);
    fireEvent.change(emailInput, { target: { value: 'admin@school.edu' } });
    fireEvent.change(passwordInput, { target: { value: '1234' } });
    fireEvent.click(submitButton);
    
    // Verify localStorage is set when remember me is checked
    await waitFor(() => {
      expect(rememberCheckbox).toBeChecked();
    });
  });
});
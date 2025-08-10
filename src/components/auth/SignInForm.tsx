'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock as FiLock, Shield as FiShield } from 'lucide-react';
import Link from 'next/link';

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempCredentials, setTempCredentials] = useState<{email: string, password: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let email: string;
      let password: string;

      if (requires2FA && tempCredentials) {
        // Handle 2FA verification
        email = tempCredentials.email;
        password = tempCredentials.password;
        
        const result = await signIn('credentials', {
          email,
          password,
          twoFactorCode,
          rememberMe: rememberMe.toString(),
          trustDevice: trustDevice.toString(),
          redirect: false,
        });

        if (result?.error === 'INVALID_2FA_CODE') {
          setError('Invalid verification code. Please try again.');
        } else if (result?.ok) {
          // Successful login with 2FA
          router.push('/dashboard');
          router.refresh();
        } else {
          setError(result?.error || 'Authentication failed. Please try again.');
        }
      } else {
        // Regular login attempt
        const formData = new FormData(e.currentTarget);
        email = formData.get('email') as string;
        password = formData.get('password') as string;

        const result = await signIn('credentials', {
          email,
          password,
          rememberMe: rememberMe.toString(),
          trustDevice: trustDevice.toString(),
          redirect: false,
        });

        if (result?.error === '2FA_REQUIRED') {
          // User has 2FA enabled, show 2FA input
          setRequires2FA(true);
          setTempCredentials({ email, password });
          setError('');
        } else if (result?.error) {
          setError('Invalid email or password');
        } else if (result?.ok) {
          // Successful login without 2FA
          router.push('/dashboard');
          router.refresh();
        } else {
          setError('Authentication failed. Please try again.');
        }
      }
    } catch (error) {
      setError('An error occurred during sign in');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-6 shadow-lg" role="form" aria-label="Sign in form">
      <div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground" role="heading" aria-level={2}>
          Sign in to your account
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit} role="form" aria-label="Authentication form">
        
        {!requires2FA ? (
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-label="Email address"
                aria-required="true"
                className="relative block w-full rounded-t-md border-0 py-1.5 text-foreground ring-1 ring-inset ring-gray-300 placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-label="Password"
                aria-required="true"
                className="relative block w-full rounded-b-md border-0 py-1.5 text-foreground ring-1 ring-inset ring-gray-300 placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <FiShield className="mx-auto h-12 w-12 text-primary" />
              <h3 className="mt-2 text-lg font-medium text-foreground">Two-Factor Authentication</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            <div>
              <label htmlFor="2fa-code" className="sr-only">
                Verification Code
              </label>
              <input
                id="2fa-code"
                name="2fa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                aria-label="2FA Code"
                aria-required="true"
                className="relative block w-full rounded-md border-0 py-1.5 text-center text-foreground ring-1 ring-inset ring-gray-300 placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                placeholder="000000"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setTwoFactorCode('');
                setTempCredentials(null);
                setError('');
              }}
              className="text-sm text-primary hover:text-primary-dark"
            >
              ← Back to login
            </button>
          </div>
        )}

        {!requires2FA && (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                Remember me
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="trust-device"
                name="trust-device"
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <label htmlFor="trust-device" className="ml-2 block text-sm text-foreground">
                Trust this device for 30 days
              </label>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-4" role="alert" aria-live="polite">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiShield className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiLock className="h-5 w-5 text-primary group-hover:text-primary" aria-hidden="true" />
            </span>
            {isLoading ? (requires2FA ? 'Verifying...' : 'Signing in...') : 
             (requires2FA ? 'Verify Code' : 'Sign in')}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary"
          >
            Forgot your password?
          </Link>
        </div>
      </form>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock as FiLock, Shield as FiShield } from 'lucide-react';
import Link from 'next/link';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<{code: string, message: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempCredentials, setTempCredentials] = useState<{email: string, password: string} | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<{email: string, timestamp: string} | null>(null);

  // Check URL parameters for errors on mount
  useEffect(() => {
    const urlError = searchParams?.get('error');
    const storedAttempt = localStorage.getItem('lastLoginAttempt');
    
    if (urlError) {
      const errorInfo = parseError(urlError);
      setErrorDetails(errorInfo);
      setError(errorInfo.message);
      
      // Restore last attempt info from localStorage
      if (storedAttempt) {
        try {
          const attemptData = JSON.parse(storedAttempt);
          setLastAttempt(attemptData);
        } catch (e: unknown) {
          console.error('Failed to parse last attempt:', e);
        }
      }
    }
    
    // Enable debug mode if it was previously enabled
    const debugEnabled = localStorage.getItem('debugMode') === 'true';
    setDebugMode(debugEnabled);
  }, [searchParams]);

  const parseError = (error: string | undefined) => {
    if (!error) return { code: 'UNKNOWN', message: 'An unknown error occurred' };
    
    // Check if error contains our custom format (CODE|Message)
    if (error.includes('|')) {
      const [code, message] = error.split('|');
      return { code, message };
    }
    
    // Handle standard NextAuth errors
    switch (error) {
      case 'CredentialsSignin':
        return { code: 'CREDENTIALS_SIGNIN', message: 'Authentication failed. Please check your credentials.' };
      case 'SessionRequired':
        return { code: 'SESSION_REQUIRED', message: 'You must be logged in to access this page.' };
      case 'OAuthSignin':
        return { code: 'OAUTH_ERROR', message: 'Error occurred during OAuth sign in.' };
      default:
        return { code: 'GENERIC_ERROR', message: error };
    }
  };

  const toggleDebugMode = () => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    localStorage.setItem('debugMode', newDebugMode.toString());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setErrorDetails(null);
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
          const errorInfo = parseError('INVALID_2FA|Invalid verification code. Please try again.');
          setErrorDetails(errorInfo);
          setError(errorInfo.message);
        } else if (result?.ok) {
          // Successful login with 2FA
          router.push('/dashboard');
          router.refresh();
        } else {
          const errorInfo = parseError(result?.error ?? undefined);
          setErrorDetails(errorInfo);
          setError(errorInfo.message);
        }
      } else {
        // Regular login attempt
        const formData = new FormData(e.currentTarget);
        email = formData.get('email') as string;
        password = formData.get('password') as string;

        // Store login attempt in localStorage before attempting signin
        const attemptData = {
          email,
          timestamp: new Date().toISOString(),
          rememberMe,
          trustDevice
        };
        localStorage.setItem('lastLoginAttempt', JSON.stringify(attemptData));

        console.log('🔐 Attempting login with:', { email, rememberMe, trustDevice });

        const result = await signIn('credentials', {
          email,
          password,
          rememberMe: rememberMe.toString(),
          trustDevice: trustDevice.toString(),
          redirect: false,
        });

        console.log('🔐 Login result:', result);

        if (result?.error === '2FA_REQUIRED') {
          // User has 2FA enabled, show 2FA input
          setRequires2FA(true);
          setTempCredentials({ email, password });
          setError('');
          setErrorDetails(null);
        } else if (result?.error) {
          const errorInfo = parseError(result?.error ?? undefined);
          setErrorDetails(errorInfo);
          setError(errorInfo.message);
        } else if (result?.ok) {
          // Successful login without 2FA
          router.push('/dashboard');
          router.refresh();
        } else {
          const errorInfo = parseError('UNKNOWN_ERROR|Authentication failed. Please try again.');
          setErrorDetails(errorInfo);
          setError(errorInfo.message);
        }
      }
    } catch (error: unknown) {
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
                Trust this device for 7 days
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
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-destructive">{error}</h3>
                {errorDetails && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-destructive/80">
                      <strong>Error Code:</strong> {errorDetails.code}
                    </p>
                    <div className="text-xs text-destructive/70">
                      {errorDetails.code === 'USER_NOT_FOUND' && (
                        <p>• Check if you entered the correct email address</p>
                      )}
                      {errorDetails.code === 'INVALID_PASSWORD' && (
                        <>
                          <p>• Make sure you entered the correct password</p>
                          <p>• Passwords are case-sensitive</p>
                          <p>• <Link href="/auth/forgot-password" className="underline">Forgot your password?</Link></p>
                        </>
                      )}
                      {errorDetails.code === 'NO_PASSWORD' && (
                        <p>• Your account needs a password. <Link href="/auth/forgot-password" className="underline">Click here to set one</Link></p>
                      )}
                      {errorDetails.code === 'ACCOUNT_SUSPENDED' && (
                        <p>• Contact your administrator to reactivate your account</p>
                      )}
                      {errorDetails.code === 'RATE_LIMITED' && (
                        <p>• Please wait a few minutes before trying again</p>
                      )}
                      {errorDetails.code === 'MISSING_CREDENTIALS' && (
                        <p>• Please enter both email and password</p>
                      )}
                      {errorDetails.code === 'CREDENTIALS_SIGNIN' && (
                        <>
                          <p>• There was an issue with the authentication process</p>
                          <p>• This might be a temporary server issue</p>
                          <p>• Try clearing your browser cache and cookies</p>
                        </>
                      )}
                    </div>
                    {debugMode && (
                      <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                        <p className="font-mono">Debug Information:</p>
                        <pre className="mt-1 text-xs overflow-auto">
                          {JSON.stringify(errorDetails, null, 2)}
                        </pre>
                        {lastAttempt && (
                          <div className="mt-2 pt-2 border-t border-destructive/20">
                            <p className="font-mono">Last Attempt:</p>
                            <p>Email: {lastAttempt.email}</p>
                            <p>Time: {new Date(lastAttempt.timestamp).toLocaleString()}</p>
                            <p className="mt-1 text-xs">
                              Check browser console for detailed logs
                            </p>
                          </div>
                        )}
                        {errorDetails?.code === 'CREDENTIALS_SIGNIN' && (
                          <div className="mt-2 pt-2 border-t border-destructive/20">
                            <p className="font-bold">Common Causes:</p>
                            <ul className="text-xs mt-1 space-y-1">
                              <li>• Check auth-options.ts authorize() function</li>
                              <li>• Verify error is being thrown with proper format</li>
                              <li>• Check if authorize() is returning null</li>
                              <li>• Look for console errors in terminal</li>
                              <li>• Verify database connection is working</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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

        <div className="text-center space-y-2">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary"
          >
            Forgot your password?
          </Link>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setDebugMode(!debugMode)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {debugMode ? 'Hide' : 'Show'} Debug Info
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 